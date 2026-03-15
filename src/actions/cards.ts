"use server";

import { apiRequest } from "./http";
import type {
  AddCardToUserLocationInput,
  Card,
  ReorderUserLocationCardsInput,
} from "./types";

export async function getDailyCardsAction(): Promise<Card[]> {
  return apiRequest<Card[]>("/cards/daily", {
    method: "GET",
  });
}

export async function createUserCardAction(
  formData: FormData,
  accessToken: string,
): Promise<Card> {
  return apiRequest<Card>("/user/cards", {
    method: "POST",
    token: accessToken,
    body: formData,
  });
}

export async function addCardToUserLocationAction(
  userLocationId: string,
  input: AddCardToUserLocationInput,
  accessToken: string,
): Promise<void> {
  await apiRequest<void>(
    `/user/locations/${encodeURIComponent(userLocationId)}/cards`,
    {
      method: "POST",
      token: accessToken,
      body: input,
    },
  );
}

export async function removeCardFromUserLocationAction(
  userLocationId: string,
  cardId: string,
  accessToken: string,
): Promise<void> {
  await apiRequest<void>(
    `/user/locations/${encodeURIComponent(userLocationId)}/cards/${encodeURIComponent(cardId)}`,
    {
      method: "DELETE",
      token: accessToken,
    },
  );
}

export async function reorderUserLocationCardsAction(
  userLocationId: string,
  input: ReorderUserLocationCardsInput,
  accessToken: string,
): Promise<void> {
  await apiRequest<void>(
    `/user/locations/${encodeURIComponent(userLocationId)}/cards/reorder`,
    {
      method: "PUT",
      token: accessToken,
      body: input,
    },
  );
}
