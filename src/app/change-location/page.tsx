import { getLocationsAction } from "@/actions/locations";
import type { Location } from "@/actions/types";
import ChangeLocationClient from "./change-location-client";

async function fetchLocations(): Promise<Location[]> {
  try {
    const locations = await getLocationsAction();
    return Array.isArray(locations) ? locations : [];
  } catch {
    return [];
  }
}

export default async function ChangeLocationPage() {
  const locations = await fetchLocations();

  return <ChangeLocationClient locations={locations} />;
}
