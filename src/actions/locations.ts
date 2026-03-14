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
  return apiRequest<Location[]>("/locations/nearby", {
    method: "GET",
    query: {
      lat: params.lat,
      lng: params.lng,
      radius_m: params.radius_m,
    },
  });
}

export async function getLocationsAction(): Promise<Location[]> {
  return apiRequest<Location[]>("/locations", {
    method: "GET",
  });
}

export async function getLocationCardsAction(
  locationId: string,
): Promise<Card[]> {
  return apiRequest<Card[]>(
    `/locations/${encodeURIComponent(locationId)}/cards`,
    {
      method: "GET",
    },
  );
}

export async function getUserLocationsAction(
  accessToken: string,
): Promise<Location[]> {
  return apiRequest<Location[]>("/user/locations", {
    method: "GET",
    token: accessToken,
  });
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
  return apiRequest<Card[]>(
    `/user/locations/${encodeURIComponent(userLocationId)}/cards`,
    {
      method: "GET",
      token: accessToken,
    },
  );
}
