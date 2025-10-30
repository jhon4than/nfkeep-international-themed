import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Globe, LogOut, Menu, LayoutDashboard, FileText, Upload as UploadIcon, User, Check } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Navbar() {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const location = useLocation();

  const navLinks = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/invoices", label: t("nav.invoices"), icon: FileText },
    { to: "/upload", label: t("nav.upload"), icon: UploadIcon },
    { to: "/profile", label: t("nav.profile"), icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavLinks = ({ variant = "desktop" }: { variant?: "mobile" | "desktop" }) => (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={
            variant === "mobile"
              ? `flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors justify-start ${
                  isActive(link.to)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"
                }`
              : `flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.to) ? "text-primary" : "text-muted-foreground"
                }`
          }
        >
          {link.icon && <link.icon className="h-4 w-4" />}
          {link.label}
        </Link>
      ))}
    </>
  );

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto grid grid-cols-3 h-20 md:h-16 items-center px-4 md:flex md:justify-between">
        {/* Mobile: Menu à esquerda | Desktop: Logo + Links à esquerda */}
        <div className="flex items-center gap-6">
          {/* Mobile menu (esquerda) */}
          <div className="flex md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="rounded-r-[5px]">
                <div className="flex flex-col gap-5 mt-8">
                  <NavLinks variant="mobile" />
                  {/* Dropdown de Tema */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors justify-start text-muted-foreground hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground">
                        <Sun className="h-5 w-5 mr-2" />
                        Tema
                      </button>
                    </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-popover text-popover-foreground border border-border shadow-md space-y-2">
                      <DropdownMenuItem
                        className={`${theme === "light" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`}
                        onClick={() => setTheme("light")}
                      >
                        <Sun className="h-4 w-4 mr-2" /> Claro
                        {theme === "light" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={`${theme === "dark" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`}
                        onClick={() => setTheme("dark")}
                      >
                        <Moon className="h-4 w-4 mr-2" /> Escuro
                        {theme === "dark" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={`${theme === "system" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`}
                        onClick={() => setTheme("system")}
                      >
                        <Sun className="h-4 w-4 mr-2" /> Sistema
                        {theme === "system" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Dropdown de Idioma */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors justify-start text-muted-foreground hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground">
                        <Globe className="h-5 w-5 mr-2" />
                        Idioma
                      </button>
                    </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-popover text-popover-foreground border border-border shadow-md space-y-2">
                      <DropdownMenuItem
                        className={`${locale === "pt-BR" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`}
                        onClick={() => setLocale("pt-BR")}
                      >
                        🇧🇷 Português
                        {locale === "pt-BR" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={`${locale === "en" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`}
                        onClick={() => setLocale("en")}
                      >
                        🇺🇸 English
                        {locale === "en" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={`${locale === "es" ? "bg-primary text-primary-foreground" : "hover:bg-mynf-secondary/50 hover:text-mynf-secondary-foreground"} flex items-center`}
                        onClick={() => setLocale("es")}
                      >
                        🇪🇸 Español
                        {locale === "es" && <Check className="h-4 w-4 ml-auto opacity-70" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors justify-start text-muted-foreground hover:bg-mynf-secondary hover:text-mynf-secondary-foreground">
                    <LogOut className="h-5 w-5 mr-2" />
                    {t("nav.logout")}
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: Logo + NavLinks */}
          <div className="hidden md:flex items-center gap-6">
            {/* Logo e toggle foram movidos para a Sidebar header; no desktop evitamos duplicação */}
          </div>
        </div>

        {/* Mobile: Logo centralizada */}
        <div className="flex md:hidden justify-center">
          <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/images/mynf.png" alt="MyNF Logo" className="h-15 w-15 max-w-[80px] rounded-lg object-contain dark:invert" />
          </Link>
        </div>

        {/* Controles (direita no mobile, direita no desktop) */}
        <div className="flex items-center gap-2 justify-self-end">
          {/* Theme Toggle */}
     

          {/* Logout */}
          <Button variant="ghost" size="icon" onClick={signOut} className="hidden md:flex">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">{t("nav.logout")}</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
