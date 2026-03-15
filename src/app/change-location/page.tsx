import { getNearbyLocationsAction } from "@/actions/locations";
import type { Location } from "@/actions/types";
import ChangeLocationClient from "./change-location-client";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getFirstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseCoordinate(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchNearbyLocations(
  lat: number,
  lng: number,
): Promise<Location[]> {
  try {
    const nearby = await getNearbyLocationsAction({ lat, lng });
    return Array.isArray(nearby) ? nearby : [];
  } catch {
    return [];
  }
}

export default async function ChangeLocationPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const lat = parseCoordinate(getFirstParam(params.lat));
  const lng = parseCoordinate(getFirstParam(params.lng));
  const hasCoordinates = lat !== null && lng !== null;

  const locations = hasCoordinates ? await fetchNearbyLocations(lat, lng) : [];

  return (
    <ChangeLocationClient
      locations={locations}
      hasCoordinates={hasCoordinates}
    />
  );
}
