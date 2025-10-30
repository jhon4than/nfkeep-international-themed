import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import AppSidebarLayout from "@/components/AppSidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Invoices() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  return (
    <AppSidebarLayout>
      <div>
        <h1 className="text-3xl font-bold">{t("invoices.title")}</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("invoices.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("invoices.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">
            {t("invoices.emptyState")}
          </p>
        </CardContent>
      </Card>
    </AppSidebarLayout>
  );
}
