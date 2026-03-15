import { redirect } from "next/navigation";
import { getDailyCardsAction } from "@/actions/cards";
import {
  getLocationCardsAction,
  getLocationsAction,
  getNearbyLocationsAction,
} from "@/actions/locations";
import type { Card, Location } from "@/actions/types";
import BoardClient from "./board-client";

type RawSearchParams = Record<string, string | string[] | undefined>;

const LEGACY_BOARD_NAME_MAP: Record<string, string> = {
  convenience: "コンビニ",
  hospital: "病院",
  cafe: "カフェ",
};

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

function normalizeLocationName(name: string): string {
  return name.replace(/\s+/g, "");
}

function getLocationLabel(location: Location): string {
  const trimmed = location.name.trim();
  return trimmed.length > 0 ? trimmed : location.name;
}

function findLocationByName(
  locations: Location[],
  name: string,
): Location | undefined {
  const normalizedTarget = normalizeLocationName(name);
  return locations.find((location) => {
    return normalizeLocationName(location.name) === normalizedTarget;
  });
}

async function fetchLocations(): Promise<Location[]> {
  try {
    const locations = await getLocationsAction();
    return Array.isArray(locations) ? locations : [];
  } catch {
    return [];
  }
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

async function fetchLocationCards(locationId: string): Promise<Card[]> {
  try {
    const cards = await getLocationCardsAction(locationId);
    return Array.isArray(cards) ? cards : [];
  } catch {
    return [];
  }
}

async function fetchDailyCards(): Promise<Card[]> {
  try {
    const cards = await getDailyCardsAction();
    return Array.isArray(cards) ? cards : [];
  } catch {
    return [];
  }
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const lat = parseCoordinate(getFirstParam(params.lat));
  const lng = parseCoordinate(getFirstParam(params.lng));
  const locationId = getFirstParam(params.locationId);
  const legacyBoard = getFirstParam(params.board);

  const locations = await fetchLocations();

  let selectedLocation = locationId
    ? locations.find((location) => location.id === locationId)
    : undefined;

  if (!selectedLocation && legacyBoard) {
    const resolvedName = LEGACY_BOARD_NAME_MAP[legacyBoard] ?? legacyBoard;
    selectedLocation = findLocationByName(locations, resolvedName);
  }

  if (!selectedLocation && lat !== null && lng !== null) {
    const nearbyLocations = await fetchNearbyLocations(lat, lng);
    selectedLocation = nearbyLocations[0];

    if (!selectedLocation) {
      redirect("/no-location");
    }
  }

  if (!selectedLocation) {
    selectedLocation = locations[0];
  }

  const locationCards = selectedLocation
    ? await fetchLocationCards(selectedLocation.id)
    : [];
  const dailyCards = await fetchDailyCards();

  const subtitle = selectedLocation
    ? `選択ボード: ${getLocationLabel(selectedLocation)}`
    : lat !== null && lng !== null
      ? `現在地: ${lat}, ${lng}`
      : "未指定";

  return (
    <BoardClient
      subtitle={subtitle}
      dailyCards={dailyCards}
      locationCards={locationCards}
      locationName={selectedLocation?.name}
    />
  );
}
