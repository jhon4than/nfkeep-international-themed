import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppSidebarLayout from "@/components/AppSidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [thisMonthCount, setThisMonthCount] = useState<number>(0);
  const [recentInvoices, setRecentInvoices] = useState<Array<{
    id: string;
    number: string;
    issue_date: string;
    total_amount: number;
    kind: string;
  }>>([]);

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n ?? 0);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const now = new Date();
      const firstDay = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
      const lastDay = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

      const totalRes = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setTotalInvoices(totalRes.count ?? 0);

      const monthRes = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("issue_date", firstDay)
        .lte("issue_date", lastDay);
      setThisMonthCount(monthRes.count ?? 0);

      const recentRes = await supabase
        .from("invoices")
        .select("id, number, issue_date, total_amount, kind")
        .eq("user_id", user.id)
        .order("issue_date", { ascending: false })
        .limit(5);
      setRecentInvoices(recentRes.data ?? []);
    };

    load();
  }, [user]);

  return (
    <AppSidebarLayout>
      <main className="container mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("dashboard.welcome")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.totalInvoices")}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInvoices}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalInvoices === 0 ? t("dashboard.emptyState") : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.thisMonth")}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{thisMonthCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.recentInvoices")}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t("dashboard.emptyState")} 
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInvoices.map((inv) => (
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
      </main>
    </AppSidebarLayout>
  );
}
