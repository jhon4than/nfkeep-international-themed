import { useState, useRef } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload as UploadIcon, Image, Send, Loader2 } from "lucide-react";
import AppSidebarLayout from "@/components/AppSidebarLayout";

export default function Upload() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  type KindType = "nfe" | "nfce" | "sat";
  type WarrantyUnit = "dia" | "mes" | "ano";
  type InvoiceForm = {
    access_key: string;
    number: string;
    series: string;
    issue_date: string; // YYYY-MM-DD
    total_amount: string;
    kind: KindType;
    emitente_cnpj: string;
    emitente_name: string;
    item_description: string;
    item_quantity: string | null;
    item_unit_price: string;
    item_line_total: string;
    warranty_value: string;
    warranty_unit: WarrantyUnit;
  };
  const initialInvoiceForm: InvoiceForm = {
    access_key: "",
    number: "",
    series: "",
    issue_date: "",
    total_amount: "",
    kind: "nfe",
    emitente_cnpj: "",
    emitente_name: "",
    item_description: "",
    item_quantity: null,
    item_unit_price: "",
    item_line_total: "",
    warranty_value: "",
    warranty_unit: "mes",
  };
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(initialInvoiceForm);
  const [formDirty, setFormDirty] = useState(false);
  const [preventClose, setPreventClose] = useState(false);
  const [exitConfirmActive, setExitConfirmActive] = useState(false);
  const [saveNoWarrantyActive, setSaveNoWarrantyActive] = useState(false);
  const [skipExitConfirmOnce, setSkipExitConfirmOnce] = useState(false);
  const [exitToastId, setExitToastId] = useState<number | string | null>(null);
  const [saveToastId, setSaveToastId] = useState<number | string | null>(null);
  const exitGuardRef = useRef(false);

  const updateForm = (patch: Partial<InvoiceForm>) => {
    setInvoiceForm((prev) => ({ ...prev, ...patch }));
    setFormDirty(true);
  };
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const webhookUrl = import.meta.env.VITE_WEBHOOK_ANALISAR_FOTO;

  const processFile = (file: File) => {
    // Verificar se é uma imagem, PDF ou XML
    const allowedTypes = ['image/', 'application/pdf', 'text/xml', 'application/xml'];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type)) || 
                       file.name.toLowerCase().endsWith('.xml');
    
    if (!isValidType) {
      toast.error('Por favor, selecione apenas arquivos de imagem, PDF ou XML');
      return;
    }

    // Verificar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Criar preview apenas para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const sendToWebhook = async () => {
    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo primeiro');
      return;
    }

    if (!webhookUrl) {
      toast.error('URL do webhook não configurada');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      // Criar FormData para enviar arquivo binário
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('filename', selectedFile.name);
      formData.append('timestamp', new Date().toISOString());
      
      // Debug: verificar se o arquivo está sendo anexado
      console.log('Arquivo selecionado:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
      
      // Prompt otimizado para análise da nota fiscal
      const prompt = `Analise esta nota fiscal e extraia APENAS as informações essenciais em formato JSON:

{
  "access_key": "",
  "number": "",
  "series": "",
  "issue_date": "",
  "total_amount": "",
  "kind": "",
  "emitente": {
    "cnpj": "",
    "name": ""
  },
  "itens": [
    {
      "description": "",
      "quantity": "",
      "unit_price": "",
      "line_total": ""
    }
  ]
}

INSTRUÇÕES:
- access_key: Chave de acesso da NFe (44 dígitos) ou código de verificação
- number: Número da nota fiscal
- series: Série da nota (se houver)
- issue_date: Data de emissão no formato YYYY-MM-DD
- total_amount: Valor total em formato numérico (ex: 8855.48)
- kind: Tipo da nota ("nfe", "nfce", "nfse" ou "sat")
- emitente.cnpj: CNPJ do prestador/emitente (apenas números)
- emitente.name: Razão social ou nome fantasia do emitente
- itens: Lista com descrição, quantidade, valor unitário e total de cada item

Se alguma informação não estiver disponível, deixe o campo vazio (""). Retorne APENAS o JSON válido.`;
      
      formData.append('prompt', prompt);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        // NÃO definir Content-Type - deixar o browser definir com boundary
        body: formData,
      });

      const responseData = await response.text();
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(responseData);
      } catch {
        parsedResponse = responseData;
      }

      setResponse({
        status: response.status,
        statusText: response.statusText,
        data: parsedResponse
      });

      // Extrair dados para o formulário, aceitando formatos achatados ou aninhados
      const extractInvoiceData = (data: any): InvoiceForm => {
        // Se o data vier no envelope { data: {...} }
        const payload = data?.data ?? data;
        // Mapear possíveis estruturas
        const emitCnpj = payload.emitente_cnpj ?? payload.emitente?.cnpj ?? "";
        const emitName = payload.emitente_name ?? payload.emitente?.name ?? "";
        const firstItem = Array.isArray(payload.itens) && payload.itens.length > 0 ? payload.itens[0] : null;
        const itemDesc = payload.item_description ?? firstItem?.description ?? "";
        const itemQty = payload.item_quantity ?? firstItem?.quantity ?? null;
        const itemUnit = payload.item_unit_price ?? firstItem?.unit_price ?? "0";
        const itemTotal = payload.item_line_total ?? firstItem?.line_total ?? payload.total_amount ?? "0";
        const kindRaw = (payload.kind ?? "nfe").toLowerCase();
        const kind: KindType = kindRaw === "nfce" ? "nfce" : kindRaw === "sat" ? "sat" : "nfe";

        const warrantyUnitRaw = String(payload.warranty_unit ?? "mes").toLowerCase();
        const warranty_unit: WarrantyUnit =
          warrantyUnitRaw === "ano" ? "ano" : warrantyUnitRaw === "dia" ? "dia" : "mes";
        const warranty_value = String(payload.warranty_value ?? "");

        return {
          access_key: String(payload.access_key ?? ""),
          number: String(payload.number ?? ""),
          series: String(payload.series ?? ""),
          issue_date: String(payload.issue_date ?? ""),
          total_amount: String(payload.total_amount ?? ""),
          kind,
          emitente_cnpj: String(emitCnpj ?? ""),
          emitente_name: String(emitName ?? ""),
          item_description: String(itemDesc ?? ""),
          item_quantity: itemQty === null || itemQty === undefined ? null : String(itemQty),
          item_unit_price: String(itemUnit ?? "0"),
          item_line_total: String(itemTotal ?? "0"),
          warranty_value,
          warranty_unit,
        };
      };

      // Abrir formulário ao finalizar a análise
      setInvoiceForm(extractInvoiceData(parsedResponse));
      setDialogOpen(true);
      setFormDirty(false);

      if (response.ok) {
        toast.success('Arquivo enviado com sucesso!');
      } else {
        toast.error(`Erro: ${response.status} - ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Erro ao enviar para webhook:', error);
      toast.error(`Erro ao enviar: ${error.message}`);
      setResponse({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    // Evita que o fechamento do Dialog abra confirmação de saída
    setSkipExitConfirmOnce(true);
    exitGuardRef.current = true;
    setDialogOpen(false);

    // Limpa estados do formulário e upload
    setInvoiceForm(initialInvoiceForm);
    setFormDirty(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResponse(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveInvoice = async () => {
    try {
      if (!user) {
        toast.error("Você precisa estar autenticado para salvar.");
        return;
      }
      // Converte garantia para dias (ano=365, mes=30, dia=1)
      const warrantyToDays = (valueStr: string, unit: WarrantyUnit): number | null => {
        const v = parseInt(valueStr, 10);
        if (isNaN(v) || v < 0) return null;
        if (unit === "ano") return v * 365;
        if (unit === "mes") return v * 30;
        return v; // dia
      };
      const warranty_days = warrantyToDays(invoiceForm.warranty_value, invoiceForm.warranty_unit);
      // Fallback enquanto a migração não está aplicada: salvar em meses
      const warranty_months = warranty_days == null ? null : Math.ceil(warranty_days / 30);
      // Valida campos obrigatórios
      const required: (keyof InvoiceForm)[] = [
        "access_key",
        "number",
        "issue_date",
        "total_amount",
        "kind",
        "emitente_cnpj",
        "item_unit_price",
        "item_line_total",
      ];
      for (const k of required) {
        // item_quantity pode ser null; demais não podem ser string vazia
        const v = invoiceForm[k as keyof InvoiceForm];
        if (v === undefined || v === null || String(v).trim() === "") {
          toast.error(`Preencha o campo obrigatório: ${k}`);
          return;
        }
      }

      // Confirmação por snackbar quando garantia está vazia
      const warrantyEmpty =
        invoiceForm.warranty_value === undefined ||
        invoiceForm.warranty_value === null ||
        String(invoiceForm.warranty_value).trim() === "";

      const proceedSave = async () => {
        setSaving(true);
        const insertRes = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            retailer_id: null,
            access_key: invoiceForm.access_key,
            number: invoiceForm.number,
            series: invoiceForm.series || null,
            issue_date: invoiceForm.issue_date,
            total_amount: invoiceForm.total_amount,
            kind: invoiceForm.kind,
            emitente_cnpj: invoiceForm.emitente_cnpj,
            emitente_name: invoiceForm.emitente_name || null,
            item_description: invoiceForm.item_description || null,
            item_quantity: invoiceForm.item_quantity,
            item_unit_price: invoiceForm.item_unit_price,
            item_line_total: invoiceForm.item_line_total,
            warranty_days:
              invoiceForm.warranty_value !== undefined && invoiceForm.warranty_value !== null && invoiceForm.warranty_value !== ""
                ? (
                    invoiceForm.warranty_unit === "ano"
                      ? Number(invoiceForm.warranty_value) * 365
                      : invoiceForm.warranty_unit === "mes"
                        ? Number(invoiceForm.warranty_value) * 30
                        : Number(invoiceForm.warranty_value)
                  )
                : null,
          })
          .select("id");

        if (insertRes.error) throw insertRes.error;

        const insertedId = insertRes.data?.[0]?.id;
        if (insertedId && warranty_days != null) {
          try {
            await supabase
              .from("invoices")
              .update({ warranty_days } as any)
              .eq("id", insertedId);
          } catch (e: any) {
            console.warn("warranty_days update skipped:", e?.message ?? e);
          }
        }
        // Upload do arquivo selecionado para o Storage do Supabase
        if (insertedId && selectedFile) {
          try {
            const timestamp = Date.now();
            const safeName = selectedFile.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
            const storagePath = `${user.id}/${insertedId}/${timestamp}_${safeName}`;
            const { error: uploadError } = await supabase.storage
              .from("invoices")
              .upload(storagePath, selectedFile, {
                upsert: true,
                contentType: selectedFile.type || undefined,
              });
            if (uploadError) throw uploadError;
          } catch (uploadErr: any) {
            console.error("Erro ao enviar arquivo para Storage:", uploadErr?.message ?? uploadErr);
            toast.error("Arquivo não pôde ser salvo no Storage.");
          }
        }
        toast.success("Nota fiscal salva com sucesso!");

        // Reset de formulário e upload após salvar com sucesso
        clearSelection();
      };

      if (warrantyEmpty) {
        if (saveNoWarrantyActive) {
          return;
        }
        setSaveNoWarrantyActive(true);
        setPreventClose(true);
        const id = toast.warning("Salvar sem garantia?", {
          description: "Esta nota será salva sem garantia.",
          duration: Infinity,
          action: {
            label: "Salvar",
            onClick: () => {
              setPreventClose(false);
              setSaveNoWarrantyActive(false);
              setSkipExitConfirmOnce(true);
              exitGuardRef.current = true;
              if (saveToastId !== null) toast.dismiss(saveToastId as any);
              setSaveToastId(null);
              void proceedSave();
            },
          },
          cancel: {
            label: "Cancelar",
            onClick: () => {
              setPreventClose(false);
              setSaveNoWarrantyActive(false);
              if (saveToastId !== null) toast.dismiss(saveToastId as any);
              setSaveToastId(null);
            },
          },
        });
        setSaveToastId(id as any);
        return;
      }

      await proceedSave();
      // Opcional: limpar ou manter formulário
    } catch (err: any) {
      const msg = err?.message || "Erro ao salvar.";
      toast.error(msg);
      console.error("saveInvoice error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppSidebarLayout>
      <div className="container mx-auto p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t("upload.title")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Envie um arquivo (imagem, PDF ou XML) para processarmos os dados da sua nota.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 sm:h-6 sm:w-6" />
                Upload de Nota Fiscal
              </CardTitle>
              <CardDescription>
                Selecione ou arraste o arquivo da sua nota fiscal para processar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Upload Area */}
              <div className="space-y-4">
                <Label>Selecionar Imagem</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors cursor-pointer ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="space-y-4">
                      {selectedFile.type.startsWith('image/') && previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-w-full max-h-48 sm:max-h-64 mx-auto rounded-lg shadow-md"
                        />
                      ) : selectedFile.type === 'application/pdf' ? (
                         <div className="w-28 h-28 sm:w-32 sm:h-32 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center mx-auto">
                           <div className="text-center">
                             <div className="text-red-600 text-xl sm:text-2xl mb-2">📄</div>
                             <div className="text-xs text-red-600 font-medium">PDF</div>
                           </div>
                         </div>
                       ) : (selectedFile.type === 'text/xml' || selectedFile.type === 'application/xml' || selectedFile.name.toLowerCase().endsWith('.xml')) ? (
                         <div className="w-28 h-28 sm:w-32 sm:h-32 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center mx-auto">
                           <div className="text-center">
                             <div className="text-blue-600 text-xl sm:text-2xl mb-2">📋</div>
                             <div className="text-xs text-blue-600 font-medium">XML</div>
                           </div>
                         </div>
                       ) : null}
                      <p className="text-sm text-muted-foreground">
                        {selectedFile?.name} ({((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <UploadIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">Arraste um arquivo (imagem, PDF ou XML)</p>
                        <p className="text-sm text-muted-foreground">ou clique para selecionar (máximo 10MB)</p>
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,text/xml,application/xml,.xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={sendToWebhook}
                  disabled={!selectedFile || loading}
                  className="w-full sm:flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Processar Nota
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setInvoiceForm(initialInvoiceForm); setDialogOpen(true); }}
                  className="w-full sm:w-auto"
                >
                  Abrir Formulário
                </Button>
                <Button
                  variant="outline"
                  onClick={clearSelection}
                  disabled={!selectedFile}
                  className="w-full sm:w-auto"
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Removido bloco de resposta em JSON para não parecer teste */}

          {/* Formulário de Edição e Salvamento em Dialog */}
          <Dialog
            open={dialogOpen}
            onOpenChange={(next) => {
              if (!next) {
                if (exitGuardRef.current || skipExitConfirmOnce) {
                  exitGuardRef.current = false;
                  setSkipExitConfirmOnce(false);
                  setDialogOpen(false);
                  return;
                }
                if (formDirty) {
                  if (exitConfirmActive) {
                    setDialogOpen(true);
                    return;
                  }
                  setExitConfirmActive(true);
                  const id = toast.warning("Deseja sair", {
                    description: "Se sair, os dados do formulário serão perdidos.",
                    duration: Infinity,
                    action: {
                      label: "Sair",
                      onClick: () => {
                        setSkipExitConfirmOnce(true);
                        exitGuardRef.current = true;
                        setDialogOpen(false);
                        setInvoiceForm(initialInvoiceForm);
                        setFormDirty(false);
                        setExitConfirmActive(false);
                        if (exitToastId !== null) toast.dismiss(exitToastId as any);
                        setExitToastId(null);
                      },
                    },
                    cancel: {
                      label: "Cancelar",
                      onClick: () => {
                        setExitConfirmActive(false);
                        if (exitToastId !== null) toast.dismiss(exitToastId as any);
                        setExitToastId(null);
                      },
                    },
                  });
                  setExitToastId(id as any);
                  // Impede o fechamento automático até o usuário confirmar
                  setDialogOpen(true);
                  return;
                }
              }
              setDialogOpen(next);
            }}
          >
            <DialogContent
              className="w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto"
              onInteractOutside={(e) => {
                if (preventClose) {
                  e.preventDefault();
                }
              }}
              onEscapeKeyDown={(e) => {
                if (exitGuardRef.current || skipExitConfirmOnce) return;
                if (formDirty) {
                  e.preventDefault();
                  if (exitConfirmActive) return;
                  setExitConfirmActive(true);
                  const id = toast.warning("Deseja sair", {
                    description: "Se sair, os dados do formulário serão perdidos.",
                    duration: Infinity,
                    action: {
                      label: "Sair",
                      onClick: () => {
                        setSkipExitConfirmOnce(true);
                        exitGuardRef.current = true;
                        setDialogOpen(false);
                        setInvoiceForm(initialInvoiceForm);
                        setFormDirty(false);
                        setExitConfirmActive(false);
                        if (exitToastId !== null) toast.dismiss(exitToastId as any);
                        setExitToastId(null);
                      },
                    },
                    cancel: {
                      label: "Cancelar",
                      onClick: () => {
                        setExitConfirmActive(false);
                        if (exitToastId !== null) toast.dismiss(exitToastId as any);
                        setExitToastId(null);
                      },
                    },
                  });
                  setExitToastId(id as any);
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Confirmar dados da Nota Fiscal</DialogTitle>
                <DialogDescription>Revise os campos e ajuste antes de salvar</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Access Key</Label>
                    <Input value={invoiceForm.access_key}
                      onChange={(e) => updateForm({ access_key: e.target.value })} />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input value={invoiceForm.number}
                      onChange={(e) => updateForm({ number: e.target.value })} />
                  </div>
                  <div>
                    <Label>Série</Label>
                    <Input value={invoiceForm.series}
                      onChange={(e) => updateForm({ series: e.target.value })} />
                  </div>
                  <div>
                    <Label>Data de Emissão (YYYY-MM-DD)</Label>
                    <Input value={invoiceForm.issue_date}
                      onChange={(e) => updateForm({ issue_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Valor Total</Label>
                    <Input value={invoiceForm.total_amount}
                      onChange={(e) => updateForm({ total_amount: e.target.value })} />
                  </div>
                  <div>
                    <Label>Tipo (nfe, nfce, sat)</Label>
                    <Input value={invoiceForm.kind}
                      onChange={(e) => {
                        const v = e.target.value.toLowerCase();
                        const allowed = ["nfe", "nfce", "sat"] as const;
                        updateForm({ kind: (allowed.includes(v as any) ? v : "nfe") as any });
                      }} />
                  </div>
                  <div>
                    <Label>Emitente CNPJ</Label>
                    <Input value={invoiceForm.emitente_cnpj}
                      onChange={(e) => updateForm({ emitente_cnpj: e.target.value })} />
                  </div>
                  <div>
                    <Label>Emitente Nome</Label>
                    <Input value={invoiceForm.emitente_name}
                      onChange={(e) => updateForm({ emitente_name: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Item Descrição</Label>
                    <Input value={invoiceForm.item_description}
                      onChange={(e) => updateForm({ item_description: e.target.value })} />
                  </div>
                  <div>
                    <Label>Item Quantidade</Label>
                    <Input value={invoiceForm.item_quantity ?? ""}
                      onChange={(e) => updateForm({ item_quantity: e.target.value || null })} />
                  </div>
                  <div>
                    <Label>Item Valor Unitário</Label>
                    <Input value={invoiceForm.item_unit_price}
                      onChange={(e) => updateForm({ item_unit_price: e.target.value })} />
                  </div>
                  <div>
                    <Label>Item Valor Total</Label>
                    <Input value={invoiceForm.item_line_total}
                      onChange={(e) => updateForm({ item_line_total: e.target.value })} />
                  </div>
                  {/* Garantia */}
                  <div className="sm:col-span-2">
                    <Label>Garantia</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Valor"
                        value={invoiceForm.warranty_value}
                        onChange={(e) => updateForm({ warranty_value: e.target.value })}
                      />
                      <Select
                        value={invoiceForm.warranty_unit}
                        onValueChange={(v) => updateForm({ warranty_unit: v as WarrantyUnit })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dia">Dia</SelectItem>
                          <SelectItem value="mes">Mês</SelectItem>
                          <SelectItem value="ano">Ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Exemplo: 1 ano, 6 meses, 20 dias</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button onClick={saveInvoice} disabled={saving || !user} className="w-full sm:w-auto">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>Salvar Nota</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (formDirty) {
                        toast.warning("Deseja sair", {
                          description: "Se sair, os dados do formulário serão perdidos.",
                          action: {
                            label: "Sair",
                            onClick: () => {
                              setDialogOpen(false);
                              setInvoiceForm(initialInvoiceForm);
                              setFormDirty(false);
                            },
                          },
                          cancel: {
                            label: "Cancelar",
                          },
                        });
                      } else {
                        setDialogOpen(false);
                        setInvoiceForm(initialInvoiceForm);
                        setFormDirty(false);
                      }
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {/* Bloco de informações do webhook removido para experiência mais limpa */}
        </div>
      </div>
    </AppSidebarLayout>
  );
}