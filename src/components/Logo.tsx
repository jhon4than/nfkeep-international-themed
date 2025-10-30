import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  linkTo?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function Logo({ 
  className, 
  size = "md", 
  showText = false, 
  linkTo = "/dashboard",
  onClick 
}: LogoProps) {
  const { theme } = useTheme();
  
  // Determina qual logo usar baseado no tema
  const getLogoSrc = () => {
    if (theme === "dark") {
      return "/images/my_nf_dark.png";
    } else if (theme === "light") {
      return "/images/my_nf_light.png";
    } else {
      // Para tema "system", usa CSS para detectar preferência do sistema
      return "/images/my_nf_light.png";
    }
  };

  // Define tamanhos baseado na prop size
  const sizeClasses = {
    sm: "h-8 w-8 max-w-[32px]",
    md: "h-12 w-12 max-w-[48px]", 
    lg: "h-15 w-15 max-w-[80px]"
  };

  const logoElement = (
    <div className="flex items-center gap-2">
      {/* Logo principal - sempre visível */}
      <img 
        src={getLogoSrc()}
        alt="MyNF Logo" 
        className={cn(
          "rounded-lg object-contain transition-all duration-200",
          sizeClasses[size],
          // Para tema system, usa CSS para alternar automaticamente
          theme === "system" && "dark:content-[url('/images/my_nf_dark.png')]",
          className
        )}
      />
      
      {/* Texto opcional */}
      {showText && (
        <span className="font-semibold text-lg text-foreground">
          MyNF
        </span>
      )}
    </div>
  );

  // Se linkTo for fornecido, envolve em Link
  if (linkTo) {
    return (
      <Link 
        to={linkTo} 
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        onClick={onClick}
      >
        {logoElement}
      </Link>
    );
  }

  // Senão, retorna apenas o elemento
  return (
    <div 
      className={cn("flex items-center gap-2", onClick && "cursor-pointer hover:opacity-80 transition-opacity")}
      onClick={onClick}
    >
      {logoElement}
    </div>
  );
}