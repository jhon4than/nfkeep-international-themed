import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppSidebarLayout from "@/components/AppSidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";

export default function Invoices() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  const formatCurrency = (n: number) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n ?? 0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id, number, issue_date, kind, total_amount, access_key")
        .eq("user_id", user.id)
        .order("issue_date", { ascending: false });
      setInvoices(data ?? []);
    };
    load();
  }, [user]);

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
      <div>
        <h1 className="text-3xl font-bold">{t("invoices.title")}</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("invoices.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.number}</TableCell>
                    <TableCell>{inv.issue_date}</TableCell>
                    <TableCell className="uppercase">{inv.kind}</TableCell>
                    <TableCell className="text-right">{formatCurrency(inv.total_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppSidebarLayout>
  );
}
