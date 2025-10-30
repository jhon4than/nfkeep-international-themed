import { ChangeEvent } from "react";
import {
  UploadCloud as UploadIcon,
  LoaderCircle as LoadingIcon,
  BadgeCheck as SuccessIcon,
  CloudAlert as ErrorIcon,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useI18n } from "@/contexts/I18nContext";

import { useToast } from "@/hooks/use-toast";
import { UploadState, useFileUpload } from "@/hooks/use-file-upload";

export default function Upload() {
  const { t } = useI18n();

  const { toast } = useToast();

  const { file, uploadState, uploadFile } = useFileUpload(
    () => {
      toast({
        title: t("upload.success"),
      });
    },
    (error) =>
      toast({
        title: t("upload.error"),
        description: error,
      })
  );

  function onFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    uploadFile(file);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("upload.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("upload.description")}
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t("upload.title")}</CardTitle>
            <CardDescription>{t("upload.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <label
              htmlFor="upload-file"
              className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer block"
            >
              {uploadState === UploadState.AWAITING ? (
                <>
                  <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {t("upload.dropzone")}
                  </p>
                </>
              ) : null}

              {uploadState === UploadState.UPLOADING && (
                <>
                  <LoadingIcon
                    className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin"
                    size={32}
                  />
                  <p className="text-muted-foreground mb-4">{file.name}</p>
                </>
              )}
              {uploadState === UploadState.SUCCESS && (
                <>
                  <SuccessIcon
                    className="h-12 w-12 mx-auto text-green-600 mb-4"
                    size={32}
                  />
                  <p className="text-muted-foreground mb-4">
                    {t("upload.success")}
                  </p>
                </>
              )}

              {uploadState === UploadState.ERROR && (
                <>
                  <ErrorIcon
                    className="h-12 w-12 mx-auto text-red-600 mb-4"
                    size={32}
                  />
                  <p className="text-muted-foreground mb-4">
                    {t("upload.error")}
                  </p>
                </>
              )}

              <Button>{t("upload.button")}</Button>
            </label>

            <input
              id="upload-file"
              className="hidden"
              type="file"
              onChange={onFileUpload}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
