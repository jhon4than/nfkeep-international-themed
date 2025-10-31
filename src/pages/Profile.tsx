import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebarLayout from "@/components/AppSidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

export default function Profile() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [whatsappValid, setWhatsappValid] = useState<boolean | null>(null);

  const isValidWhatsapp = (value: string) => {
    if (!value.trim()) return null; // Campo vazio não é nem válido nem inválido
    const e164 = /^\+?[1-9]\d{7,14}$/;
    return e164.test(value.replace(/\s|-/g, ""));
  };

  const handleWhatsappChange = (value: string) => {
    setWhatsapp(value);
    setWhatsappValid(isValidWhatsapp(value));
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
        .select("full_name")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setFullName(data.full_name || "");
      }
      // Carregar WhatsApp do user_metadata
      const metaWhatsapp = (user?.user_metadata as any)?.whatsapp || "";
      setWhatsapp(metaWhatsapp);
      setWhatsappValid(isValidWhatsapp(metaWhatsapp));
    } catch (error: any) {
      console.error("Error loading profile:", error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar WhatsApp apenas se não estiver vazio
    if (whatsapp.trim() && !isValidWhatsapp(whatsapp)) {
      toast.error(t("auth.whatsappInvalid"));
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from("users_public")
        .update({ full_name: fullName })
        .eq("id", user?.id);

      if (error) throw error;
      // Atualizar WhatsApp em user_metadata
      const { error: metaError } = await supabase.auth.updateUser({ data: { whatsapp } });
      if (metaError) throw metaError;
      toast.success(t("profile.updateSuccess"));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppSidebarLayout>
            <main className="container mx-auto p-6 space-y-6">

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
              <Label htmlFor="whatsapp">{t("profile.whatsapp")}</Label>
              <div className="relative">
                <Input
                  id="whatsapp"
                  type="tel"
                  inputMode="tel"
                  placeholder={t("auth.whatsappPlaceholder")}
                  value={whatsapp}
                  onChange={(e) => handleWhatsappChange(e.target.value)}
                  className={`pr-10 ${
                    whatsappValid === true 
                      ? "border-mynf-success focus:ring-mynf-success" 
                      : whatsappValid === false 
                      ? "border-mynf-error focus:ring-mynf-error" 
                      : ""
                  }`}
                />
                {whatsappValid !== null && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {whatsappValid ? (
                      <CheckCircle className="h-4 w-4 text-mynf-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-mynf-error" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("auth.whatsappHint")}</p>
              {whatsappValid === false && (
                <p className="text-xs text-mynf-error">{t("auth.whatsappInvalid")}</p>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("profile.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
      </main>
    </AppSidebarLayout>
  );
}