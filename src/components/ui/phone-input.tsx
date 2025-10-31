import React, { useState } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { cn } from "@/lib/utils";

interface CountryCode {
  code: string;
  name: string;
  flag: string;
}

const countryCodes: CountryCode[] = [
  { code: "+55", name: "Brasil", flag: "🇧🇷" },
  { code: "+1", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "+34", name: "Espanha", flag: "🇪🇸" },
  { code: "+33", name: "França", flag: "🇫🇷" },
  { code: "+49", name: "Alemanha", flag: "🇩🇪" },
  { code: "+44", name: "Reino Unido", flag: "🇬🇧" },
  { code: "+39", name: "Itália", flag: "🇮🇹" },
  { code: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "+52", name: "México", flag: "🇲🇽" },
  { code: "+56", name: "Chile", flag: "🇨🇱" },
  { code: "+57", name: "Colômbia", flag: "🇨🇴" },
  { code: "+51", name: "Peru", flag: "🇵🇪" },
  { code: "+598", name: "Uruguai", flag: "🇺🇾" },
];

interface PhoneInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  className?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  isValid?: boolean | null;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  className,
  required = false,
  hint,
  error,
  isValid,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <div className="flex gap-2">
        <Select value={countryCode} onValueChange={onCountryCodeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {countryCodes.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span className="text-sm">{country.code}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "flex-1",
            isValid === true && "border-green-500",
            isValid === false && "border-red-500"
          )}
          required={required}
        />
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && isValid === false && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};