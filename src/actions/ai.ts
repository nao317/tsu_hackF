"use server";

import { apiRequest } from "./http";
import type { AiRecommendInput, AiRecommendResponse } from "./types";

export async function recommendSentenceAction(
  input: AiRecommendInput,
): Promise<AiRecommendResponse> {
  return apiRequest<AiRecommendResponse>("/ai/recommend", {
    method: "POST",
    body: input,
  });
}
