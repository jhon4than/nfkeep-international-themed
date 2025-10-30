import { useState, useRef } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Image, Send, Loader2 } from "lucide-react";

export default function WebhookTest() {
  const { t } = useI18n();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const webhookUrl = import.meta.env.VITE_WEBHOOK_ANALISAR_FOTO;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      // Verificar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }

      setSelectedFile(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const sendToWebhook = async () => {
    if (!selectedFile) {
      toast.error('Por favor, selecione uma imagem primeiro');
      return;
    }

    if (!webhookUrl) {
      toast.error('URL do webhook não configurada');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('filename', selectedFile.name);
      formData.append('timestamp', new Date().toISOString());

      const response = await fetch(webhookUrl, {
        method: 'POST',
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

      if (response.ok) {
        toast.success('Imagem enviada com sucesso!');
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <p className="text-sm text-muted-foreground">
                        {selectedFile?.name} ({(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">Arraste uma imagem aqui</p>
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
                  accept="image/*"
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
                  <li>image: arquivo da imagem</li>
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