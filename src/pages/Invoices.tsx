import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppSidebarLayout from "@/components/AppSidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Invoices() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [previews, setPreviews] = useState<Record<string, { url: string; type: "image" | "pdf" }>>({});
  const [previewsLoading, setPreviewsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const formatCurrency = (n: number) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n ?? 0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setPageLoading(true);
      let data: any[] | null = null;
      try {
        const res = await supabase
          .from("invoices")
          .select("*")
          .eq("user_id", user.id)
          .order("issue_date", { ascending: false });
        data = res.data ?? [];
        setInvoices(data);
      } finally {
        // Oculta o loading assim que as notas forem carregadas (ou mesmo em caso de erro)
        setPageLoading(false);
      }

      // Construir previews em paralelo, sem bloquear a UI
      if ((data ?? []).length === 0) {
        setPreviewsLoading(false);
      } else {
        setPreviewsLoading(true);
        void (async () => {
          const nextPreviews: Record<string, { url: string; type: "image" | "pdf" }> = {};
          await Promise.allSettled(
            (data ?? []).map(async (inv) => {
              try {
                const prefix = `${user.id}/${inv.id}`;
                const { data: files, error } = await supabase.storage
                  .from("invoices")
                  .list(prefix, { limit: 100 });
                if (error) return;
                if (!files || files.length === 0) return;
                const sorted = [...files].sort((a, b) => (a.name > b.name ? -1 : a.name < b.name ? 1 : 0));
                const file = sorted[0];
                const path = `${prefix}/${file.name}`;
                const ext = file.name.split(".").pop()?.toLowerCase() || "";
                const isImage = ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(ext);
                const type: "image" | "pdf" = isImage ? "image" : ext === "pdf" ? "pdf" : "image";
                const { data: signed } = await supabase.storage
                  .from("invoices")
                  .createSignedUrl(path, 60 * 60);
                if (signed?.signedUrl) {
                  nextPreviews[inv.id] = { url: signed.signedUrl, type };
                }
              } catch {}
            })
          );
          setPreviews(nextPreviews);
          setPreviewsLoading(false);
        })();
      }
    };
    load();
  }, [user]);

  const viewDetails = async (id: string) => {
    if (!user) return;
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      setDetailsData(data);
    } catch (e: any) {
      setDetailsData({ error: e?.message ?? String(e) });
    } finally {
      setDetailsLoading(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      (inv.number ?? "").toLowerCase().includes(s) ||
      (inv.access_key ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <AppSidebarLayout>
      {(pageLoading || previewsLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
            <main className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("invoices.title")}</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("invoices.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 sm:h-11"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("invoices.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              {t("invoices.emptyState")}
            </p>
          ) : (
            <>
              {/* Lista em cards para mobile */}
              <div className="md:hidden space-y-3">
                {filtered.map((inv) => (
                  <div key={inv.id} className="rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Número</p>
                        <p className="text-base font-semibold">{inv.number ?? "—"}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm text-muted-foreground">Valor</p>
                        <p className="text-base font-semibold">{formatCurrency(inv.total_amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        {inv.issue_date ? new Date(inv.issue_date as any).toLocaleDateString("pt-BR") : "—"}
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 uppercase">
                        {inv.kind}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {previews[inv.id] ? (
                          previews[inv.id].type === "image" ? (
                            <img
                              src={previews[inv.id].url}
                              alt="Arquivo da nota"
                              className="h-10 w-auto rounded border"
                            />
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(previews[inv.id].url, "_blank")}
                            >
                              PDF
                            </Button>
                          )
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem arquivo</span>
                        )}
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => viewDetails(inv.id)}>
                        Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela com scroll para iPad/desktop */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Emissão</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.number}</TableCell>
                        <TableCell>
                          {inv.issue_date ? new Date(inv.issue_date as any).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell className="uppercase">{inv.kind}</TableCell>
                        <TableCell className="text-right">{formatCurrency(inv.total_amount)}</TableCell>
                        <TableCell>
                          {previews[inv.id] ? (
                            previews[inv.id].type === "image" ? (
                              <img
                                src={previews[inv.id].url}
                                alt="Arquivo da nota"
                                className="h-16 w-auto rounded border"
                              />
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => window.open(previews[inv.id].url, "_blank")}
                              >
                                Visualizar PDF
                              </Button>
                            )
                          ) : (
                            <span className="text-muted-foreground">Sem arquivo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="secondary" onClick={() => viewDetails(inv.id)}>
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-3xl md:max-w-4xl p-4 sm:p-6 rounded-none sm:rounded-lg max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detalhes da Nota</DialogTitle>
          </DialogHeader>
          {detailsLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : detailsData ? (
            <div className="space-y-4">
              {/* Cabeçalho amigável */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="text-lg font-semibold">{detailsData.number ?? "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Data de emissão</p>
                  <p className="text-lg font-semibold">
                    {detailsData.issue_date
                      ? new Date(detailsData.issue_date).toLocaleDateString("pt-BR")
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Grade de campos formatados e traduzidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(detailsData)
                  .filter(([key]) => !/^id$/i.test(key) && !/_id$/i.test(key))
                  .filter(([key]) => !["number", "issue_date"].includes(key))
                  .map(([key, val]) => {
                    const labels: Record<string, string> = {
                      // Campos principais (Title Case PT-BR)
                      number: "Número",
                      series: "Série",
                      issue_date: "Data de Emissão",
                      total_amount: "Valor Total",
                      kind: "Tipo",
                      access_key: "Chave de Acesso",
                      // Garantia
                      warranty_months: "Garantia (Meses)",
                      warranty_end: "Término da Garantia",
                      // Metadados
                      created_at: "Criado em",
                      updated_at: "Atualizado em",
                      // XML
                      xml_data: "Dados XML",
                      // Possíveis campos de emitente/destinatário
                      emitter_name: "Emitente",
                      emitter_cnpj: "Emitente CNPJ",
                      retailer_id: "Emitente (ID)",
                      recipient_name: "Destinatário",
                      recipient_cnpj: "Destinatário CNPJ",
                    };

                    const dict: Record<string, string> = {
                      // Comuns
                      number: "Número",
                      series: "Série",
                      issue: "Emissão",
                      date: "Data",
                      total: "Total",
                      amount: "Valor",
                      kind: "Tipo",
                      key: "Chave",
                      access: "Acesso",
                      created: "Criado",
                      updated: "Atualizado",
                      at: "em",
                      warranty: "Garantia",
                      months: "Meses",
                      end: "Término",
                      xml: "XML",
                      data: "Dados",
                      // Entidades
                      emitter: "Emitente",
                      issuer: "Emitente",
                      retailer: "Emitente",
                      recipient: "Destinatário",
                      company: "Empresa",
                      name: "Nome",
                      cnpj: "CNPJ",
                      cpf: "CPF",
                      address: "Endereço",
                      street: "Rua",
                      city: "Cidade",
                      state: "Estado",
                      country: "País",
                      zip: "CEP",
                      // Fiscais e técnicos
                      cfop: "CFOP",
                      ncm: "NCM",
                      icms: "ICMS",
                      pis: "PIS",
                      cofins: "COFINS",
                    };

                    const translateLabel = (k: string) => {
                      if (labels[k]) return labels[k];
                      const tokens = k.split(/[_\s]+/);
                      const mapped = tokens.map((tok) => {
                        const lower = tok.toLowerCase();
                        if (["cnpj", "cpf", "xml", "ncm", "cfop", "icms", "pis", "cofins"].includes(lower)) {
                          return lower.toUpperCase();
                        }
                        const m = dict[lower];
                        if (!m) return tok.charAt(0).toUpperCase() + tok.slice(1);
                        // Mantém preposição "em" minúscula
                        return m === "em" ? m : m.charAt(0).toUpperCase() + m.slice(1);
                      });
                      return mapped.join(" ");
                    };

                    const formattedValue = (() => {
                      if (key === "total_amount" && typeof val === "number") {
                        try {
                          // Usa o formatCurrency já usado na tabela, se existir
                          // @ts-ignore
                          return typeof formatCurrency === "function"
                            ? // @ts-ignore
                              formatCurrency(val)
                            : new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(val);
                        } catch {}
                      }
                      if ((key === "created_at" || key === "updated_at") && val) {
                        try {
                          return new Date(String(val)).toLocaleString("pt-BR");
                        } catch {}
                      }
                      if (key === "kind" && typeof val === "string") {
                        return val.toUpperCase();
                      }
                      if (typeof val === "object" && val !== null) {
                        return JSON.stringify(val);
                      }
                      return String(val ?? "");
                    })();

                    return (
                      <div key={key} className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">
                          {translateLabel(key)}
                        </p>
                        <p className="text-sm font-medium break-words">{formattedValue || "—"}</p>
                      </div>
                    );
                  })}
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Fechar</Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Sem dados</p>
          )}
        </DialogContent>
      </Dialog>
      </main>
    </AppSidebarLayout>
  );
}
