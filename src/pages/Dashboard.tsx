import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppSidebarLayout from "@/components/AppSidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { FileText, Upload, ArrowRight, Calendar, Bell, User, CheckCircle, Phone } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "sonner";

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [thisMonthCount, setThisMonthCount] = useState<number>(0);
  const [recentInvoices, setRecentInvoices] = useState<Array<{
    id: string;
    number: string;
    issue_date: string;
    total_amount: number;
    kind: string;
  }>>([]);
  
  // Estados para o modal de primeira visita
  const [showFirstVisitModal, setShowFirstVisitModal] = useState(false);
  const [modalMode, setModalMode] = useState<'phone' | 'notifications'>('phone'); // Novo estado para controlar o modo do modal
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+55"); // Código do país padrão (Brasil)
  const [isLoading, setIsLoading] = useState(false);

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

  const handleCompleteRegistration = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let updateData: any = {
        first_visit: false
      };

      // Se estamos no modo telefone, salvar apenas telefone
      if (modalMode === 'phone') {
        const fullPhone = phone.trim() ? `${countryCode}${phone}` : "";
        updateData.phone = fullPhone;
      }
      
      // Sempre salvar preferências de notificação
      updateData.notifications_enabled = notificationsEnabled;

      const { error } = await supabase
        .from("users_public")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      toast.success(t("firstVisit.saveSuccess"));
      setShowFirstVisitModal(false);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error(t("firstVisit.saveError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipRegistration = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from("users_public")
        .update({ first_visit: false })
        .eq("id", user.id);
      
      setShowFirstVisitModal(false);
    } catch (error) {
      console.error("Erro ao pular configuração:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Verificar se é primeira visita
      const { data: userProfile } = await supabase
        .from("users_public")
        .select("first_visit, full_name, phone, notifications_enabled")
        .eq("id", user.id)
        .single();

      // Determinar se deve mostrar o modal e em que modo
      if (userProfile?.first_visit || !userProfile?.phone) {
        setFullName(userProfile?.full_name || "");
        setPhone(userProfile?.phone || "");
        setNotificationsEnabled(userProfile?.notifications_enabled || false);
        
        // Se não tem telefone, mostrar modo telefone
        // Se tem telefone mas é primeira visita, mostrar modo notificações
        if (!userProfile?.phone) {
          setModalMode('phone');
        } else {
          setModalMode('notifications');
        }
        
        setShowFirstVisitModal(true);
      }

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
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {t("dashboard.title")}
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
                  {t("dashboard.welcome")}
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button asChild size="lg" className="shadow-lg w-full sm:w-auto">
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
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                      {totalInvoices}
                    </p>
                  </div>
                  <div className="p-3 bg-mynf-primary/10 dark:bg-mynf-primary/20 rounded-full">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-mynf-primary dark:text-mynf-primary" />
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
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                      {thisMonthCount}
                    </p>
                  </div>
                  <div className="p-3 bg-mynf-secondary/10 dark:bg-mynf-secondary/20 rounded-full">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-mynf-secondary dark:text-mynf-secondary" />
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
                <>
                  {/* Lista em cards para mobile */}
                  <div className="sm:hidden space-y-3">
                    {recentInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{inv.number}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <span>{new Date(inv.issue_date).toLocaleDateString('pt-BR')}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 uppercase">
                              {inv.kind}
                            </span>
                          </div>
                        </div>
                        <div className="text-right font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(inv.total_amount)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tabela com scroll horizontal para iPad/desktop */}
                  <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Primeira Visita */}
      <Dialog open={showFirstVisitModal} onOpenChange={setShowFirstVisitModal}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-mynf-primary/10 rounded-full">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-mynf-primary" />
              </div>
              <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              {t("firstVisit.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {modalMode === 'phone' ? t("firstVisit.descriptionPhone") : t("firstVisit.descriptionNotifications")}
          </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">


            {/* Telefone - apenas no modo telefone */}
            {modalMode === 'phone' && (
              <div className="space-y-2">
                <PhoneInput
                  label={t("firstVisit.phone")}
                  placeholder={t("auth.phonePlaceholder")}
                  hint={t("auth.phoneHint")}
                  value={phone}
                  countryCode={countryCode}
                  onChange={setPhone}
                  onCountryCodeChange={setCountryCode}
                />
              </div>
            )}

            {/* Notificações - sempre mostrar */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Bell className="h-4 w-4" />
                {t("firstVisit.notifications")}
              </Label>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {t("firstVisit.webhookAlerts")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("firstVisit.webhookDescription")}
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleSkipRegistration}
              className="w-full sm:flex-1"
              disabled={isLoading}
            >
              {t("firstVisit.skip")}
            </Button>
            <Button
              onClick={handleCompleteRegistration}
              className="w-full sm:flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                t("firstVisit.saving")
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t("firstVisit.save")}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppSidebarLayout>
  );
}
