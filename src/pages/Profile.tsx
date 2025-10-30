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

export default function Profile() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidWhatsapp = (value: string) => {
    const e164 = /^\+?[1-9]\d{7,14}$/;
    return e164.test(value.replace(/\s|-/g, ""));
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
    } catch (error: any) {
      console.error("Error loading profile:", error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidWhatsapp(whatsapp)) {
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
              <Input
                id="whatsapp"
                type="tel"
                inputMode="tel"
                pattern="^\+?[1-9]\d{7,14}$"
                placeholder={t("auth.whatsappPlaceholder")}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("auth.whatsappHint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">{t("profile.whatsapp")}</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder={t("auth.whatsappPlaceholder")}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("auth.whatsappHint")}</p>
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