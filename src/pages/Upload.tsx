import { useI18n } from "@/contexts/I18nContext";
import AppSidebarLayout from "@/components/AppSidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon } from "lucide-react";

export default function Upload() {
  const { t } = useI18n();

  return (
    <AppSidebarLayout>
      <div>
        <h1 className="text-3xl font-bold">{t("upload.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("upload.description")}</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t("upload.title")}</CardTitle>
          <CardDescription>{t("upload.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t("upload.dropzone")}</p>
            <Button>{t("upload.button")}</Button>
          </div>
        </CardContent>
      </Card>
    </AppSidebarLayout>
  );
}
