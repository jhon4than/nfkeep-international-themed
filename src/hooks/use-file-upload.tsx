import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

async function uploadToSupabase(file: File) {
  const { data } = await supabase.auth.getSession();

  const userId = data.session.user.id;

  const { error } = await supabase.storage
    .from("invoices")
    .upload(`user_${userId}/${Date.now()}_${file.name}`, file);

  if (error) {
    throw error.message;
  }
}

export enum UploadState {
  AWAITING,
  UPLOADING,
  SUCCESS,
  ERROR,
}

export function useFileUpload(
  onSuccessCallback: () => void,
  onErrorCallback: (error: string) => void
) {
  const [file, setFile] = useState<File>(null);
  const [uploadState, setUploadState] = useState<UploadState>(
    UploadState.AWAITING
  );

  useEffect(() => {
    if (!file) return;

    setUploadState(UploadState.UPLOADING);

    uploadToSupabase(file)
      .then(() => {
        onSuccessCallback();

        setUploadState(UploadState.SUCCESS);
      })
      .catch((error: string) => {
        onErrorCallback(error);

        setUploadState(UploadState.ERROR);
      })
      .finally(() => {
        setFile(null);
      });
  }, [file]);

  return { file, uploadState, uploadFile: setFile };
}
