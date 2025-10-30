import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, Upload as UploadIcon, User, Moon, Sun, Globe, LogOut, Check } from "lucide-react";
import { Logo } from "@/components/Logo";

type AppSidebarLayoutProps = {
  children: React.ReactNode;
};

export function AppSidebarLayout({ children }: AppSidebarLayoutProps) {
  const { t, locale, setLocale } = useI18n();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const SidebarLogoHeader = () => {
    const { state, toggleSidebar } = useSidebar();
    return (
      <SidebarHeader className="flex items-center justify-center gap-3 p-4 py-6">
        <Logo 
          size="lg"
          linkTo="/dashboard"
          className="group-data-[collapsible=icon]:hidden"
          onClick={(e) => {
            if (state === "collapsed") {
              e.preventDefault();
              toggleSidebar();
            }
          }}
        />
        <SidebarTrigger className="absolute top-2 right-2" />
      </SidebarHeader>
    );
  };

  return (
    <SidebarProvider>
      <div className="hidden md:block">
        <Sidebar side="left" collapsible="icon" variant="sidebar">
          <SidebarLogoHeader />
          <SidebarContent className="px-2 py-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === "/dashboard"}>
                      <Link to="/dashboard">
                        <LayoutDashboard />
                        <span>{t("nav.dashboard")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === "/invoices"}>
                      <Link to="/invoices">
                        <FileText />
                        <span>{t("nav.invoices")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === "/upload"}>
                      <Link to="/upload">
                        <UploadIcon />
                        <span>{t("nav.upload")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === "/profile"}>
                      <Link to="/profile">
                        <User />
                        <span>{t("nav.profile")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter>
            <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-stretch">
              {/* Tema */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground">
                    {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <span className="group-data-[collapsible=icon]:hidden">Tema</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-popover text-popover-foreground border border-border shadow-md space-y-2">
                  <DropdownMenuItem className={`${theme === "light" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`} onClick={() => setTheme("light")}>
                    Claro
                    {theme === "light" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem className={`${theme === "dark" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`} onClick={() => setTheme("dark")}>
                    Escuro
                    {theme === "dark" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem className={`${theme === "system" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`} onClick={() => setTheme("system")}>
                    Sistema
                    {theme === "system" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Idioma */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">Idioma</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-popover text-popover-foreground border border-border shadow-md space-y-2">
                  <DropdownMenuItem className={`${locale === "pt-BR" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`} onClick={() => setLocale("pt-BR")}>
                    🇧🇷 Português
                    {locale === "pt-BR" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem className={`${locale === "en" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`} onClick={() => setLocale("en")}>
                    🇺🇸 English
                    {locale === "en" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem className={`${locale === "es" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`} onClick={() => setLocale("es")}>
                    🇪🇸 Español
                    {locale === "es" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sair */}
              <button onClick={signOut} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground">
                <LogOut className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">Sair</span>
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>
      </div>

      <SidebarInset>
        <div className="md:hidden">
          <Navbar />
        </div>
        <main className="container mx-auto p-6 space-y-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AppSidebarLayout;