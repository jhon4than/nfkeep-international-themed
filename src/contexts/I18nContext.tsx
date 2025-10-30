import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Locale = "pt-BR" | "en" | "es";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  formatDate: (date: Date) => string;
  formatCurrency: (amount: number) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<Locale, Record<string, string>> = {
  "pt-BR": {
    // Navbar
    "nav.dashboard": "Painel",
    "nav.invoices": "Minhas Notas",
    "nav.upload": "Upload",
    "nav.profile": "Perfil",
    "nav.logout": "Sair",
    // Auth
    "auth.login": "Entrar",
    "auth.signup": "Cadastrar",
    "auth.email": "E-mail",
    "auth.password": "Senha",
    "auth.fullName": "Nome Completo",
    "auth.continueWithGoogle": "Continuar com Google",
    "auth.or": "ou",
    "auth.haveAccount": "Já tem uma conta?",
    "auth.noAccount": "Não tem uma conta?",
    "auth.welcome": "Bem-vindo ao NF-Keep",
    "auth.subtitle": "Gerencie suas notas fiscais com segurança",
    // Dashboard
    "dashboard.title": "Painel",
    "dashboard.welcome": "Bem-vindo de volta!",
    "dashboard.recentInvoices": "Notas Fiscais Recentes",
    "dashboard.totalInvoices": "Total de Notas",
    "dashboard.thisMonth": "Este Mês",
    "dashboard.emptyState": "Nenhuma nota fiscal encontrada. Faça o upload da sua primeira nota!",
    // Invoices
    "invoices.title": "Minhas Notas Fiscais",
    "invoices.search": "Buscar notas...",
    "invoices.emptyState": "Você ainda não tem notas fiscais. Comece fazendo o upload!",
    // Upload
    "upload.title": "Upload de Nota Fiscal",
    "upload.description": "Faça o upload das suas notas fiscais em PDF ou imagem",
    "upload.dropzone": "Arraste arquivos aqui ou clique para selecionar",
    "upload.button": "Fazer Upload",
    // Profile
    "profile.title": "Meu Perfil",
    "profile.updateSuccess": "Perfil atualizado com sucesso!",
    "profile.save": "Salvar Alterações",
    // Common
    "common.loading": "Carregando...",
    "common.error": "Erro",
    "common.success": "Sucesso!",
  },
  "en": {
    // Navbar
    "nav.dashboard": "Dashboard",
    "nav.invoices": "My Invoices",
    "nav.upload": "Upload",
    "nav.profile": "Profile",
    "nav.logout": "Logout",
    // Auth
    "auth.login": "Login",
    "auth.signup": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.fullName": "Full Name",
    "auth.continueWithGoogle": "Continue with Google",
    "auth.or": "or",
    "auth.haveAccount": "Already have an account?",
    "auth.noAccount": "Don't have an account?",
    "auth.welcome": "Welcome to NF-Keep",
    "auth.subtitle": "Manage your invoices securely",
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome back!",
    "dashboard.recentInvoices": "Recent Invoices",
    "dashboard.totalInvoices": "Total Invoices",
    "dashboard.thisMonth": "This Month",
    "dashboard.emptyState": "No invoices found. Upload your first invoice!",
    // Invoices
    "invoices.title": "My Invoices",
    "invoices.search": "Search invoices...",
    "invoices.emptyState": "You don't have any invoices yet. Start by uploading one!",
    // Upload
    "upload.title": "Upload Invoice",
    "upload.description": "Upload your invoices in PDF or image format",
    "upload.dropzone": "Drag files here or click to select",
    "upload.button": "Upload",
    // Profile
    "profile.title": "My Profile",
    "profile.updateSuccess": "Profile updated successfully!",
    "profile.save": "Save Changes",
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success!",
  },
  "es": {
    // Navbar
    "nav.dashboard": "Panel",
    "nav.invoices": "Mis Facturas",
    "nav.upload": "Subir",
    "nav.profile": "Perfil",
    "nav.logout": "Salir",
    // Auth
    "auth.login": "Iniciar Sesión",
    "auth.signup": "Registrarse",
    "auth.email": "Correo Electrónico",
    "auth.password": "Contraseña",
    "auth.fullName": "Nombre Completo",
    "auth.continueWithGoogle": "Continuar con Google",
    "auth.or": "o",
    "auth.haveAccount": "¿Ya tienes una cuenta?",
    "auth.noAccount": "¿No tienes una cuenta?",
    "auth.welcome": "Bienvenido a NF-Keep",
    "auth.subtitle": "Gestiona tus facturas de forma segura",
    // Dashboard
    "dashboard.title": "Panel",
    "dashboard.welcome": "¡Bienvenido de nuevo!",
    "dashboard.recentInvoices": "Facturas Recientes",
    "dashboard.totalInvoices": "Total de Facturas",
    "dashboard.thisMonth": "Este Mes",
    "dashboard.emptyState": "No se encontraron facturas. ¡Sube tu primera factura!",
    // Invoices
    "invoices.title": "Mis Facturas",
    "invoices.search": "Buscar facturas...",
    "invoices.emptyState": "Aún no tienes facturas. ¡Comienza subiendo una!",
    // Upload
    "upload.title": "Subir Factura",
    "upload.description": "Sube tus facturas en formato PDF o imagen",
    "upload.dropzone": "Arrastra archivos aquí o haz clic para seleccionar",
    "upload.button": "Subir",
    // Profile
    "profile.title": "Mi Perfil",
    "profile.updateSuccess": "¡Perfil actualizado correctamente!",
    "profile.save": "Guardar Cambios",
    // Common
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "¡Éxito!",
  },
};

const detectBrowserLanguage = (): Locale => {
  const browserLang = navigator.language;
  if (browserLang.startsWith("pt")) return "pt-BR";
  if (browserLang.startsWith("es")) return "es";
  return "en";
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem("nfkeep:locale");
    return (stored as Locale) || detectBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem("nfkeep:locale", locale);
  }, [locale]);

  const t = (key: string): string => {
    return translations[locale][key] || key;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(locale).format(date);
  };

  const formatCurrency = (amount: number): string => {
    const currencyMap: Record<Locale, string> = {
      "pt-BR": "BRL",
      "en": "USD",
      "es": "EUR",
    };
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyMap[locale],
    }).format(amount);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: setLocaleState, t, formatDate, formatCurrency }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
