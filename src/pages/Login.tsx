import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Globe } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();

  // Base URL para redirecionamentos (produção ou dev)
  const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const isValidWhatsapp = (value: string) => {
    // Validação simples: E.164 (+DD... até 15 dígitos) ou somente dígitos 8-15
    const e164 = /^\+?[1-9]\d{7,14}$/;
    return e164.test(value.replace(/\s|-/g, ""));
  };

  const isValidEmail = (value: string) => {
    // Validação simples de e-mail (RFC-like)
    return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar e-mail antes de prosseguir
    if (!isValidEmail(email)) {
      toast.error(t("auth.emailInvalid"));
      return;
    }
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("common.success"));
        navigate("/dashboard");
      } else {
        // Signup: validar WhatsApp
        if (!isValidWhatsapp(whatsapp)) {
          toast.error(t("auth.whatsappInvalid"));
          setLoading(false);
          return;
        }
        const redirectUrl = `${SITE_URL}/dashboard`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: fullName, whatsapp },
          },
        });
        if (error) throw error;
        toast.success(t("common.success"));
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const redirectUrl = `${SITE_URL}/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;
    } catch (error: any) {
      const friendly =
        error?.error_code === "validation_failed" || /Unsupported provider/i.test(error?.message)
          ? "Login com Google não está habilitado no Supabase ou há divergência de projeto/variáveis. Verifique se o provedor Google está ativado no mesmo projeto das chaves usadas no app e se as URLs de redirecionamento estão corretas."
          : error?.message ?? "Erro ao iniciar login com Google.";
      toast.error(friendly);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <div className="mb-8">
            <Logo size="lg" className="max-w-[160px] mx-auto mb-6" />
            <p className="text-lg text-muted-foreground max-w-md">
              {t("auth.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-8">
        {/* Theme & Language Controls */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          {/* Theme */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="sr-only">Change theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}> 
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="2" />
                </svg>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setLocale("pt-BR")}>🇧🇷 Português</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale("en")}>🇺🇸 English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale("es")}>🇪🇸 Español</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <Logo size="lg" className="max-w-[80px]" linkTo="" />
          </div>

          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground">
                {isLogin ? t("auth.login") : t("auth.signup")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isLogin ? t("auth.loginSubtitle") : t("auth.signupSubtitle")}
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 font-medium text-base"
              onClick={handleGoogleAuth}
              type="button"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t("auth.continueWithGoogle")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t("auth.or")}</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-5">
              {!isLogin && (
                <div className="space-y-3">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    {t("auth.fullName")}
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
              )}
              {!isLogin && (
                <div className="space-y-3">
                  <Label htmlFor="whatsapp" className="text-sm font-medium">
                    {t("auth.whatsapp")}
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder={t("auth.whatsappPlaceholder")}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="h-12"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("auth.whatsappHint")}
                  </p>
                </div>
              )}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("auth.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("auth.password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 font-medium text-base" 
                  disabled={loading}
                >
                  {loading ? t("common.loading") : isLogin ? t("auth.login") : t("auth.signup")}
                </Button>
              </div>
            </form>

            <div className="text-center pt-6">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
