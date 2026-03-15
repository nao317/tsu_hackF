import { getLocationsAction } from "@/actions/locations";
import type { Location } from "@/actions/types";
import NoLocationClient from "./no-location-client";

async function fetchLocations(): Promise<Location[]> {
  try {
    const locations = await getLocationsAction();
    return Array.isArray(locations) ? locations : [];
  } catch {
    return [];
  }
}

export default async function NoLocationPage() {
  const locations = await fetchLocations();

  return <NoLocationClient locations={locations} />;
}
