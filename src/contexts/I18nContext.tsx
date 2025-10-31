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
    "auth.emailInvalid": "Informe um e-mail válido.",
    "auth.phone": "Telefone",
      "auth.phonePlaceholder": "11 91234-5678",
      "auth.phoneHint": "Informe um número de telefone válido (com DDD e, se possível, com código do país).",
      "auth.phoneInvalid": "Informe um telefone válido.",
    "auth.continueWithGoogle": "Continuar com Google",
    "auth.or": "ou",
    "auth.haveAccount": "Já tem uma conta?",
    "auth.noAccount": "Não tem uma conta?",
    "auth.welcome": "Bem-vindo ao MyNF",
    "auth.subtitle": "Gerencie suas notas fiscais com segurança",
    "auth.description": "Gerencie suas notas fiscais de forma simples e segura",
    "auth.loginSubtitle": "Acesse sua conta",
    "auth.signupSubtitle": "Crie sua conta gratuita",
    // Dashboard
    "dashboard.title": "Painel",
    "dashboard.welcome": "Bem-vindo de volta!",
    "dashboard.recentInvoices": "Notas Fiscais Recentes",
    "dashboard.totalInvoices": "Total de Notas",
    "dashboard.thisMonth": "Este Mês",
    "dashboard.emptyState": "Nenhuma nota fiscal encontrada. Faça o upload da sua primeira nota!",
    "dashboard.quickActions": "Ações Rápidas",
    "dashboard.uploadInvoice": "Fazer Upload",
    "dashboard.uploadDescription": "Envie uma nova nota fiscal",
    "dashboard.viewInvoices": "Ver Notas",
    "dashboard.viewInvoicesDescription": "Visualizar todas as notas fiscais",
    "dashboard.manageProfile": "Gerenciar Perfil",
    "dashboard.manageProfileDescription": "Atualizar informações pessoais",
    "dashboard.noInvoicesFound": "Nenhuma nota fiscal encontrada",
    "dashboard.viewAll": "Ver todas",
    "dashboard.tableNumber": "Número",
    "dashboard.tableDate": "Data",
    "dashboard.tableType": "Tipo",
    "dashboard.tableValue": "Valor",
    // First Visit Modal
      "firstVisit.title": "Bem-vindo ao MyNF!",
      "firstVisit.description": "Complete seu cadastro com telefone e configure suas preferências de notificação para receber alertos importantes.",
      "firstVisit.descriptionPhone": "Complete seu cadastro com seu telefone para continuar usando o MyNF.",
      "firstVisit.descriptionNotifications": "Configure suas preferências de notificação para receber alertos importantes.",
      "firstVisit.fullName": "Nome Completo",
    "firstVisit.fullNamePlaceholder": "Digite seu nome completo",
    "firstVisit.phone": "Telefone",
    "firstVisit.phonePlaceholder": "(11) 99999-9999",
    "firstVisit.notifications": "Preferências de Notificação",
    "firstVisit.webhookAlerts": "Receber alertas via webhook",
    "firstVisit.webhookDescription": "Notificações sobre vencimento de garantias e outros alertes importantes",
    "firstVisit.skip": "Pular por agora",
    "firstVisit.save": "Salvar",
    "firstVisit.saving": "Salvando...",
    "firstVisit.saveSuccess": "Configurações salvas com sucesso!",
    "firstVisit.saveError": "Erro ao salvar configurações. Tente novamente.",
    // Invoices
    "invoices.title": "Minhas Notas Fiscais",
    "invoices.search": "Buscar notas...",
    "invoices.emptyState": "Você ainda não tem notas fiscais. Comece fazendo o upload!",
    // Upload
    "upload.title": "Upload de Nota Fiscal",
    "upload.description": "Faça o upload das suas notas fiscais em PDF ou imagem",
    "upload.dropzone": "Arraste arquivos aqui ou clique para selecionar",
    "upload.button": "Fazer Upload",
    "upload.success": "Nota Fiscal enviada com sucesso!",
    "upload.error": "Falha ao enviar a nota fiscal, tente novamente mais tarde",
    // Profile
    "profile.title": "Meu Perfil",
    "profile.updateSuccess": "Perfil atualizado com sucesso!",
    "profile.save": "Salvar Alterações",
    "profile.phone": "Telefone",
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
    "auth.emailInvalid": "Please provide a valid email.",
    "auth.phone": "Phone",
      "auth.phonePlaceholder": "415 555 2671",
      "auth.phoneHint": "Provide a valid phone number (include area and country code).",
      "auth.phoneInvalid": "Please provide a valid phone number.",
    "auth.continueWithGoogle": "Continue with Google",
    "auth.or": "or",
    "auth.haveAccount": "Already have an account?",
    "auth.noAccount": "Don't have an account?",
    "auth.welcome": "Welcome to MyNF",
    "auth.subtitle": "Manage your invoices securely",
    "auth.description": "Manage your invoices simply and securely",
    "auth.loginSubtitle": "Access your account",
    "auth.signupSubtitle": "Create your free account",
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome back!",
    "dashboard.recentInvoices": "Recent Invoices",
    "dashboard.totalInvoices": "Total Invoices",
    "dashboard.thisMonth": "This Month",
    "dashboard.emptyState": "No invoices found. Upload your first invoice!",
    "dashboard.quickActions": "Quick Actions",
    "dashboard.uploadInvoice": "Upload Invoice",
    "dashboard.uploadDescription": "Upload a new invoice",
    "dashboard.viewInvoices": "View Invoices",
    "dashboard.viewInvoicesDescription": "View all your invoices",
    "dashboard.manageProfile": "Manage Profile",
    "dashboard.manageProfileDescription": "Update personal information",
    "dashboard.noInvoicesFound": "No invoices found",
    "dashboard.viewAll": "View all",
    "dashboard.tableNumber": "Number",
    "dashboard.tableDate": "Date",
    "dashboard.tableType": "Type",
    "dashboard.tableValue": "Value",
    // First Visit Modal
      "firstVisit.title": "Welcome to MyNF!",
      "firstVisit.description": "Complete your registration with phone number and configure your notification preferences to receive important alerts.",
      "firstVisit.descriptionPhone": "Complete your registration with your phone number to continue using MyNF.",
      "firstVisit.descriptionNotifications": "Configure your notification preferences to receive important alerts.",
      "firstVisit.fullName": "Full Name",
    "firstVisit.fullNamePlaceholder": "Enter your full name",
    "firstVisit.phone": "Phone",
    "firstVisit.phonePlaceholder": "(11) 99999-9999",
    "firstVisit.notifications": "Notification Preferences",
    "firstVisit.webhookAlerts": "Receive webhook alerts",
    "firstVisit.webhookDescription": "Notifications about warranty expiration and other important alerts",
    "firstVisit.skip": "Skip for now",
    "firstVisit.save": "Save",
    "firstVisit.saving": "Saving...",
    "firstVisit.saveSuccess": "Settings saved successfully!",
    "firstVisit.saveError": "Error saving settings. Please try again.",
    // Invoices
    "invoices.title": "My Invoices",
    "invoices.search": "Search invoices...",
    "invoices.emptyState": "You don't have any invoices yet. Start by uploading one!",
    // Upload
    "upload.title": "Upload Invoice",
    "upload.description": "Upload your invoices in PDF or image format",
    "upload.dropzone": "Drag files here or click to select",
    "upload.button": "Upload",
    "upload.success": "Invoice sent successfully!",
    "upload.error": "Failed to send invoice, please try again later.",
    // Profile
    "profile.title": "My Profile",
    "profile.updateSuccess": "Profile updated successfully!",
    "profile.save": "Save Changes",
    "profile.phone": "Phone",
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
    "auth.emailInvalid": "Indique un correo electrónico válido.",
    "auth.phone": "Teléfono",
      "auth.phonePlaceholder": "600 123 456",
      "auth.phoneHint": "Indique un número de teléfono válido (incluya código de área y país).",
      "auth.phoneInvalid": "Indique un número de teléfono válido.",
    "auth.continueWithGoogle": "Continuar con Google",
    "auth.or": "o",
    "auth.haveAccount": "¿Ya tienes una cuenta?",
    "auth.noAccount": "¿No tienes una cuenta?",
    "auth.welcome": "Bienvenido a MyNF",
    "auth.subtitle": "Gestiona tus facturas de forma segura",
    "auth.description": "Gestiona tus facturas de forma simple y segura",
    "auth.loginSubtitle": "Accede a tu cuenta",
    "auth.signupSubtitle": "Crea tu cuenta gratuita",
    // Dashboard
    "dashboard.title": "Panel",
    "dashboard.welcome": "¡Bienvenido de nuevo!",
    "dashboard.recentInvoices": "Facturas Recientes",
    "dashboard.totalInvoices": "Total de Facturas",
    "dashboard.thisMonth": "Este Mes",
    "dashboard.emptyState": "No se encontraron facturas. ¡Sube tu primera factura!",
    "dashboard.quickActions": "Acciones Rápidas",
    "dashboard.uploadInvoice": "Subir Factura",
    "dashboard.uploadDescription": "Subir una nueva factura",
    "dashboard.viewInvoices": "Ver Facturas",
    "dashboard.viewInvoicesDescription": "Ver todas tus facturas",
    "dashboard.manageProfile": "Gestionar Perfil",
    "dashboard.manageProfileDescription": "Actualizar información personal",
    "dashboard.noInvoicesFound": "No se encontraron facturas",
    "dashboard.viewAll": "Ver todas",
    "dashboard.tableNumber": "Número",
    "dashboard.tableDate": "Fecha",
    "dashboard.tableType": "Tipo",
    "dashboard.tableValue": "Valor",
    // First Visit Modal
      "firstVisit.title": "¡Bienvenido a MyNF!",
      "firstVisit.description": "Completa tu registro con número de teléfono y configura tus preferencias de notificación para recibir alertas importantes.",
      "firstVisit.descriptionPhone": "Completa tu registro con tu número de teléfono para continuar usando MyNF.",
      "firstVisit.descriptionNotifications": "Configura tus preferencias de notificación para recibir alertas importantes.",
      "firstVisit.fullName": "Nombre Completo",
    "firstVisit.fullNamePlaceholder": "Ingresa tu nombre completo",
    "firstVisit.phone": "Teléfono",
    "firstVisit.phonePlaceholder": "(11) 99999-9999",
    "firstVisit.notifications": "Preferencias de Notificación",
    "firstVisit.webhookAlerts": "Recibir alertas via webhook",
    "firstVisit.webhookDescription": "Notificaciones sobre vencimiento de garantías y otras alertas importantes",
    "firstVisit.skip": "Omitir por ahora",
    "firstVisit.save": "Guardar",
    "firstVisit.saving": "Guardando...",
    "firstVisit.saveSuccess": "¡Configuraciones guardadas exitosamente!",
    "firstVisit.saveError": "Error al guardar configuraciones. Inténtalo de nuevo.",
    // Invoices
    "invoices.title": "Mis Facturas",
    "invoices.search": "Buscar facturas...",
    "invoices.emptyState": "Aún no tienes facturas. ¡Comienza subiendo una!",
    // Upload
    "upload.title": "Subir Factura",
    "upload.description": "Sube tus facturas en formato PDF o imagen",
    "upload.dropzone": "Arrastra archivos aquí o haz clic para seleccionar",
    "upload.button": "Subir",
    "upload.success": "¡Factura enviada correctamente!",
    "upload.error": "No se pudo enviar la factura, inténtelo de nuevo más tarde.",
    // Profile
    "profile.title": "Mi Perfil",
    "profile.updateSuccess": "¡Perfil actualizado correctamente!",
    "profile.save": "Guardar Cambios",
    "profile.phone": "Teléfono",
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
    const stored = localStorage.getItem("mynf:locale");
    const normalized = stored === "pt" ? "pt-BR" : stored; // Corrige valor antigo
    const allowed = ["pt-BR", "en", "es"] as const;
    if (normalized && (allowed as readonly string[]).includes(normalized)) {
      return normalized as Locale;
    }
    return detectBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem("mynf:locale", locale);
  }, [locale]);

  const t = (key: string): string => {
    return translations[locale]?.[key] ?? key;
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
