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
import { CheckCircle, XCircle, Bell, BellOff } from "lucide-react";

export default function Profile() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+55"); // Código do país padrão (Brasil)
  const [loading, setLoading] = useState(false);
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
      <div>
        <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="phone">{t("firstVisit.phone")}</Label>
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
              <div className="flex items-center space-x-3">
                {notificationsEnabled ? (
                  <Bell className="h-5 w-5 text-mynf-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <Label htmlFor="notifications" className="text-base font-medium">
                    Notificações de Alertas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações sobre vencimento de garantias e outros alertas importantes
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              
              {firstVisit && (
                <div className="bg-mynf-primary/10 border border-mynf-primary/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Bell className="h-5 w-5 text-mynf-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-mynf-primary">Complete seu cadastro</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ative as notificações para receber alertas importantes sobre suas notas fiscais e garantias.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("profile.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppSidebarLayout>
  );
}