import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebarLayout from "@/components/AppSidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/ui/phone-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Bell, BellOff, Loader2 } from "lucide-react";

export default function Profile() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+55"); // Código do país padrão (Brasil)
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [firstVisit, setFirstVisit] = useState(true);

  const isValidPhone = (value: string) => {
    if (!value.trim()) return null; // Campo vazio não é nem válido nem inválido
    const e164 = /^\+?[1-9]\d{7,14}$/;
    return e164.test(value.replace(/\s|-/g, ""));
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setPhoneValid(isValidPhone(value));
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setPageLoading(true);
      const { data, error } = await supabase
        .from("users_public")
        .select("full_name, phone, notifications_enabled, first_visit")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setFullName(data.full_name || "");
        
        // Separar código do país do número de telefone
        const fullPhone = data.phone || "";
        if (fullPhone.startsWith("+")) {
          // Lista de códigos de país suportados (ordenados do maior para o menor para evitar conflitos)
          const supportedCodes = ["+598", "+351", "+55", "+54", "+57", "+56", "+52", "+51", "+49", "+44", "+39", "+34", "+33", "+1"];
          
          let foundCode = null;
          for (const code of supportedCodes) {
            if (fullPhone.startsWith(code)) {
              foundCode = code;
              break;
            }
          }
          
          if (foundCode) {
            setCountryCode(foundCode);
            setPhone(fullPhone.substring(foundCode.length).trim());
          } else {
            // Se não encontrar um código conhecido, usar +55 como padrão
            setCountryCode("+55");
            setPhone(fullPhone.substring(1)); // Remove apenas o +
          }
        } else {
          // Se não começar com +, assumir que é um número brasileiro
          setCountryCode("+55");
          setPhone(fullPhone);
        }
        
        setNotificationsEnabled(data.notifications_enabled || false);
        setFirstVisit(data.first_visit || false);
        setPhoneValid(isValidPhone(fullPhone));
      }
    } catch (error: any) {
      console.error("Error loading profile:", error.message);
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Concatenar código do país com número de telefone
    const fullPhone = phone.trim() ? `${countryCode}${phone}` : "";
    
    // Validar telefone apenas se não estiver vazio
    if (fullPhone && !isValidPhone(fullPhone)) {
      toast.error(t("firstVisit.phoneInvalid"));
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from("users_public")
        .update({ 
          full_name: fullName,
          phone: fullPhone,
          notifications_enabled: notificationsEnabled,
          first_visit: false
        })
        .eq("id", user?.id);

      if (error) throw error;
      
      setFirstVisit(false);
      toast.success(t("profile.updateSuccess"));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppSidebarLayout>
      {pageLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <main className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl">

      <div className="px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("profile.title")}</h1>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">{t("profile.title")}</CardTitle>
          <CardDescription className="text-sm sm:text-base break-all">{user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("auth.fullName")}</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <PhoneInput
                label={t("profile.phone")}
                placeholder={t("auth.phonePlaceholder")}
                hint={t("auth.phoneHint")}
                value={phone}
                countryCode={countryCode}
                onChange={handlePhoneChange}
                onCountryCodeChange={setCountryCode}
                isValid={phoneValid}
                error={phoneValid === false ? t("auth.phoneInvalid") : undefined}
              />
            </div>

            {/* Seção de Notificações */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start sm:items-center space-x-3">
                {notificationsEnabled ? (
                  <Bell className="h-5 w-5 text-mynf-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Label htmlFor="notifications" className="text-sm sm:text-base font-medium block">
                    Notificações de Alertas
                  </Label>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Receba notificações sobre vencimento de garantias e outros alertas importantes
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                  className="flex-shrink-0"
                />
              </div>
              
              {firstVisit && (
                <div className="bg-mynf-primary/10 border border-mynf-primary/20 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-3">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-mynf-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-medium text-mynf-primary text-sm sm:text-base">Complete seu cadastro</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Ative as notificações para receber alertas importantes sobre suas notas fiscais e garantias.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? t("common.loading") : t("profile.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
      </main>
    </AppSidebarLayout>
  );
}