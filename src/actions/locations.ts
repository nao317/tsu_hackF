"use server";

import { apiRequest } from "./http";
import type {
  Card,
  CreateUserLocationInput,
  Location,
  NearbyLocationsParams,
  UpdateUserLocationInput,
} from "./types";

export async function getNearbyLocationsAction(
  params: NearbyLocationsParams,
): Promise<Location[]> {
  const response = await apiRequest<unknown>("/locations/nearby", {
    method: "GET",
    query: {
      lat: params.lat,
      lng: params.lng,
      radius_m: params.radius_m,
    },
  });

  return Array.isArray(response) ? (response as Location[]) : [];
}

export async function getLocationsAction(): Promise<Location[]> {
  const response = await apiRequest<unknown>("/locations", {
    method: "GET",
  });

  return Array.isArray(response) ? (response as Location[]) : [];
}

export async function getLocationCardsAction(
  locationId: string,
): Promise<Card[]> {
  const response = await apiRequest<unknown>(
    `/locations/${encodeURIComponent(locationId)}/cards`,
    {
      method: "GET",
    },
  );

  return Array.isArray(response) ? (response as Card[]) : [];
}

export async function getUserLocationsAction(
  accessToken: string,
): Promise<Location[]> {
  const response = await apiRequest<unknown>("/user/locations", {
    method: "GET",
    token: accessToken,
  });

  return Array.isArray(response) ? (response as Location[]) : [];
}

export async function createUserLocationAction(
  input: CreateUserLocationInput,
  accessToken: string,
): Promise<Location> {
  return apiRequest<Location>("/user/locations", {
    method: "POST",
    token: accessToken,
    body: input,
  });
}

export async function updateUserLocationAction(
  userLocationId: string,
  input: UpdateUserLocationInput,
  accessToken: string,
): Promise<Location> {
  return apiRequest<Location>(
    `/user/locations/${encodeURIComponent(userLocationId)}`,
    {
      method: "PUT",
      token: accessToken,
      body: input,
    },
  );
}

export async function deleteUserLocationAction(
  userLocationId: string,
  accessToken: string,
): Promise<void> {
  await apiRequest<void>(
    `/user/locations/${encodeURIComponent(userLocationId)}`,
    {
      method: "DELETE",
      token: accessToken,
    },
  );
}

export async function getUserLocationCardsAction(
  userLocationId: string,
  accessToken: string,
): Promise<Card[]> {
  const response = await apiRequest<unknown>(
    `/user/locations/${encodeURIComponent(userLocationId)}/cards`,
    {
      method: "GET",
      token: accessToken,
    },
  );

  return Array.isArray(response) ? (response as Card[]) : [];
}
