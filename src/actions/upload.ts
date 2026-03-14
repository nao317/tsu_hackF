"use server";

import { apiRequest } from "./http";
import type { UploadImageResponse } from "./types";

export async function uploadImageAction(
  formData: FormData,
  accessToken: string,
): Promise<UploadImageResponse> {
  return apiRequest<UploadImageResponse>("/upload/image", {
    method: "POST",
    token: accessToken,
    body: formData,
  });
}
