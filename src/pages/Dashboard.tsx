import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppSidebarLayout from "@/components/AppSidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, ArrowRight, Calendar } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-mynf-background via-mynf-surface to-mynf-background dark:from-mynf-background dark:via-mynf-surface dark:to-mynf-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {t("dashboard.title")}
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  {t("dashboard.welcome")}
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button asChild size="lg" className="shadow-lg">
                  <Link to="/upload">
                    <Upload className="mr-2 h-5 w-5" />
                    {t("dashboard.uploadInvoice")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards - Apenas os essenciais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-card shadow-lg border-0 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {t("dashboard.totalInvoices")}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {totalInvoices}
                    </p>
                  </div>
                  <div className="p-3 bg-mynf-primary/10 dark:bg-mynf-primary/20 rounded-full">
                    <FileText className="h-6 w-6 text-mynf-primary dark:text-mynf-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-lg border-0 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {t("dashboard.thisMonth")}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {thisMonthCount}
                    </p>
                  </div>
                  <div className="p-3 bg-mynf-secondary/10 dark:bg-mynf-secondary/20 rounded-full">
                    <Calendar className="h-6 w-6 text-mynf-secondary dark:text-mynf-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices - Agora ocupa toda a largura */}
          <Card className="bg-card shadow-lg border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                  {t("dashboard.recentInvoices")}
                </CardTitle>
                {recentInvoices.length > 0 && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/invoices" className="text-mynf-primary hover:text-mynf-primary/80 dark:text-mynf-primary dark:hover:text-mynf-primary/80">
                      {t("dashboard.viewAll")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    {t("dashboard.noInvoicesFound")}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    {t("dashboard.emptyState")}
                  </p>
                  <Button asChild>
                    <Link to="/upload">
                      <Upload className="mr-2 h-4 w-4" />
                      {t("dashboard.uploadInvoice")}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                        <TableHead className="font-semibold text-slate-900 dark:text-white">{t("dashboard.tableNumber")}</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">{t("dashboard.tableDate")}</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-white">{t("dashboard.tableType")}</TableHead>
                        <TableHead className="text-right font-semibold text-slate-900 dark:text-white">{t("dashboard.tableValue")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentInvoices.map((inv) => (
                        <TableRow key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <TableCell className="font-medium text-slate-900 dark:text-white">
                            {inv.number}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">
                            {new Date(inv.issue_date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 uppercase">
                              {inv.kind}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(inv.total_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppSidebarLayout>
  );
}
