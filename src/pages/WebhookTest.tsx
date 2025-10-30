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
import { toast } from "sonner";
import { Upload, Image, Send, Loader2 } from "lucide-react";

export default function WebhookTest() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  type KindType = "nfe" | "nfce" | "sat";
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
  };
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(initialInvoiceForm);
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
        };
      };

      // Abrir formulário ao finalizar a análise
      setInvoiceForm(extractInvoiceData(parsedResponse));
      setDialogOpen(true);

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
    setSelectedFile(null);
    setPreviewUrl(null);
    setResponse(null);
    setInvoiceForm(initialInvoiceForm);
    setDialogOpen(false);
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

      setSaving(true);
      const { error } = await supabase
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
        });

      if (error) throw error;
      toast.success("Nota fiscal salva com sucesso!");
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
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-6 w-6" />
                Teste de Webhook - Análise de Foto
              </CardTitle>
              <CardDescription>
                Envie uma imagem para o webhook de análise: {webhookUrl}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div className="space-y-4">
                <Label>Selecionar Imagem</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
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
                          className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                        />
                      ) : selectedFile.type === 'application/pdf' ? (
                         <div className="w-32 h-32 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center mx-auto">
                           <div className="text-center">
                             <div className="text-red-600 text-2xl mb-2">📄</div>
                             <div className="text-xs text-red-600 font-medium">PDF</div>
                           </div>
                         </div>
                       ) : (selectedFile.type === 'text/xml' || selectedFile.type === 'application/xml' || selectedFile.name.toLowerCase().endsWith('.xml')) ? (
                         <div className="w-32 h-32 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center mx-auto">
                           <div className="text-center">
                             <div className="text-blue-600 text-2xl mb-2">📋</div>
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
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">Arraste uma imagem, PDF ou XML aqui</p>
                        <p className="text-sm text-muted-foreground">
                          ou clique para selecionar (máximo 10MB)
                        </p>
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

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={sendToWebhook}
                  disabled={!selectedFile || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar para Webhook
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearSelection}
                  disabled={!selectedFile}
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Response Display */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle>Resposta do Webhook</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Formulário de Edição e Salvamento em Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar dados da Nota Fiscal</DialogTitle>
                <DialogDescription>Revise e ajuste antes de salvar</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Access Key</Label>
                    <Input value={invoiceForm.access_key}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, access_key: e.target.value })} />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input value={invoiceForm.number}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, number: e.target.value })} />
                  </div>
                  <div>
                    <Label>Série</Label>
                    <Input value={invoiceForm.series}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, series: e.target.value })} />
                  </div>
                  <div>
                    <Label>Data de Emissão (YYYY-MM-DD)</Label>
                    <Input value={invoiceForm.issue_date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Valor Total</Label>
                    <Input value={invoiceForm.total_amount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, total_amount: e.target.value })} />
                  </div>
                  <div>
                    <Label>Tipo (nfe, nfce, sat)</Label>
                    <Input value={invoiceForm.kind}
                      onChange={(e) => {
                        const v = e.target.value.toLowerCase();
                        const allowed = ["nfe", "nfce", "sat"] as const;
                        setInvoiceForm({ ...invoiceForm, kind: (allowed.includes(v as any) ? v : "nfe") as any });
                      }} />
                  </div>
                  <div>
                    <Label>Emitente CNPJ</Label>
                    <Input value={invoiceForm.emitente_cnpj}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, emitente_cnpj: e.target.value })} />
                  </div>
                  <div>
                    <Label>Emitente Nome</Label>
                    <Input value={invoiceForm.emitente_name}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, emitente_name: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Item Descrição</Label>
                    <Input value={invoiceForm.item_description}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, item_description: e.target.value })} />
                  </div>
                  <div>
                    <Label>Item Quantidade</Label>
                    <Input value={invoiceForm.item_quantity ?? ""}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, item_quantity: e.target.value || null })} />
                  </div>
                  <div>
                    <Label>Item Valor Unitário</Label>
                    <Input value={invoiceForm.item_unit_price}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, item_unit_price: e.target.value })} />
                  </div>
                  <div>
                    <Label>Item Valor Total</Label>
                    <Input value={invoiceForm.item_line_total}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, item_line_total: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={saveInvoice} disabled={saving || !user}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>Salvar no Banco</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => { setDialogOpen(false); setInvoiceForm(initialInvoiceForm); }}>Cancelar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Webhook Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label>URL:</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded">
                  {webhookUrl || 'Não configurado'}
                </p>
              </div>
              <div>
                <Label>Método:</Label>
                <p className="text-sm">POST</p>
              </div>
              <div>
                <Label>Formato:</Label>
                <p className="text-sm">multipart/form-data</p>
              </div>
              <div>
                <Label>Campos enviados:</Label>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>image: arquivo da imagem, PDF ou XML</li>
                  <li>filename: nome do arquivo</li>
                  <li>timestamp: data/hora do envio</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}