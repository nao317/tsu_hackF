"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserLocationsAction } from "@/actions/locations";
import type { Location } from "@/actions/types";
import { callWithAuthRetry } from "@/lib/authApiClient";
import { getStoredAuthTokens } from "@/lib/authStorage";
import { getCurrentGpsPosition } from "@/lib/geolocation";
import styles from "../no-location/no-location.module.css";

type LocationOption = {
  id: string;
  label: string;
  distanceText?: string;
  source: "nearby" | "user";
};

function formatDistance(distanceM: number): string {
  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toFixed(1)}km`;
  }
  return `${Math.round(distanceM)}m`;
}

function toLocationOptions(
  locations: Location[],
  source: "nearby" | "user",
): LocationOption[] {
  return locations.map((location) => {
    const trimmedName = location.name.trim();
    const distanceM = location.distance_m;

    return {
      id: location.id,
      label: trimmedName.length > 0 ? trimmedName : location.name,
      distanceText:
        source === "nearby" && typeof distanceM === "number"
          ? formatDistance(distanceM)
          : undefined,
      source,
    };
  });
}

function mergeLocationOptions(
  nearbyOptions: LocationOption[],
  userOptions: LocationOption[],
): LocationOption[] {
  const merged = [...nearbyOptions, ...userOptions];
  const seen = new Set<string>();

  return merged.filter((option) => {
    if (seen.has(option.id)) {
      return false;
    }
    seen.add(option.id);
    return true;
  });
}

function toGeolocationErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }

  return "位置情報の取得に失敗しました。";
}

function toUserLocationErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "独自ロケーションの取得に失敗しました。";
}

function isAuthMessage(message: string): boolean {
  return (
    message.includes("ログイン") ||
    message.includes("認証") ||
    message.includes("セッション")
  );
}

function buildChangeLocationUrl(latitude: number, longitude: number): string {
  const searchParams = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
  });
  return `/change-location?${searchParams.toString()}`;
}

function buildBoardUrl(option: LocationOption): string {
  const searchParams = new URLSearchParams({
    locationId: option.id,
  });

  if (option.source === "user") {
    searchParams.set("locationType", "user");
    searchParams.set("locationName", option.label);
  }

  return `/board?${searchParams.toString()}`;
}

export default function ChangeLocationClient({
  locations,
  hasCoordinates,
}: {
  locations: Location[];
  hasCoordinates: boolean;
}) {
  const router = useRouter();
  const nearbyOptions = useMemo(
    () =>
      toLocationOptions(Array.isArray(locations) ? locations : [], "nearby"),
    [locations],
  );
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [isLoadingUserLocations, setIsLoadingUserLocations] = useState(false);
  const [userLocationsError, setUserLocationsError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    const storedTokens = getStoredAuthTokens();
    if (!storedTokens) {
      setUserLocations([]);
      setUserLocationsError(null);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingUserLocations(true);
    setUserLocationsError(null);

    void (async () => {
      try {
        const userLocs = await callWithAuthRetry((accessToken) =>
          getUserLocationsAction(accessToken),
        );

        if (!cancelled) {
          setUserLocations(Array.isArray(userLocs) ? userLocs : []);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setUserLocations([]);
        const message = toUserLocationErrorMessage(error);
        setUserLocationsError(isAuthMessage(message) ? null : message);
      } finally {
        if (!cancelled) {
          setIsLoadingUserLocations(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const userOptions = useMemo(
    () => toLocationOptions(userLocations, "user"),
    [userLocations],
  );
  const options = useMemo(
    () => mergeLocationOptions(nearbyOptions, userOptions),
    [nearbyOptions, userOptions],
  );
  const [selected, setSelected] = useState<string>(options[0]?.id ?? "");
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const nearbyCount = nearbyOptions.length;
  const userLocationCount = userOptions.length;

  const effectiveSelected = options.some((option) => option.id === selected)
    ? selected
    : (options[0]?.id ?? "");

  const fetchCurrentLocation = useCallback(async () => {
    setGpsError(null);
    setIsLocating(true);

    try {
      const gps = await getCurrentGpsPosition({
        enableHighAccuracy: true,
        timeout: 8000,
      });

      router.replace(buildChangeLocationUrl(gps.latitude, gps.longitude));
      setIsLocating(false);
    } catch (error) {
      setGpsError(toGeolocationErrorMessage(error));
      setIsLocating(false);
    }
  }, [router]);

  const handleConfirm = () => {
    if (!effectiveSelected) {
      return;
    }

    const selectedOption = options.find(
      (option) => option.id === effectiveSelected,
    );
    if (!selectedOption) {
      return;
    }

    router.push(buildBoardUrl(selectedOption));
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>ロケーションカードを変更</h1>

      <section className={styles.selectArea}>
        <p className={styles.prompt}>ボードを選択してください</p>
        {hasCoordinates ? (
          nearbyCount > 0 ? (
            <p className={styles.prompt}>
              現在地に近いボードと、追加したロケーションを表示しています。
            </p>
          ) : (
            <p className={styles.prompt}>
              近くのボードが見つかりませんでした。追加したロケーションは表示しています。
            </p>
          )
        ) : (
          <p className={styles.prompt}>
            現在地から探す場合は「現在地から取得」を押してください。追加したロケーションは常に表示します。
          </p>
        )}
        {userLocationCount > 0 ? (
          <p className={styles.prompt}>
            マイロケーション: {userLocationCount}件
          </p>
        ) : null}
        {isLoadingUserLocations ? (
          <p className={styles.prompt}>
            追加したロケーションを読み込み中です。
          </p>
        ) : null}
        {userLocationsError ? (
          <p className={styles.prompt}>{userLocationsError}</p>
        ) : null}
        {isLocating && (
          <p className={styles.prompt}>
            現在地を取得中です。しばらくお待ちください。
          </p>
        )}
        {gpsError && (
          <p className={styles.prompt}>
            {gpsError} 位置情報を再取得してください。
          </p>
        )}
        {options.length === 0 ? (
          <p className={styles.prompt}>
            近くのロケーションと追加ロケーションがありません。
          </p>
        ) : (
          <ul className={styles.list} role="list">
            {options.map((option) => (
              <li key={option.id} className={styles.item}>
                <label className={styles.optionLabel}>
                  <input
                    type="radio"
                    name="board"
                    value={option.id}
                    checked={effectiveSelected === option.id}
                    onChange={() => setSelected(option.id)}
                  />
                  <span className={styles.optionContent}>
                    <span className={styles.labelText}>{option.label}</span>
                    <span className={styles.distanceText}>
                      {option.distanceText ??
                        (option.source === "user" ? "マイ" : "")}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className={styles.actions}>
        <button
          className={styles.confirm}
          onClick={() => {
            void fetchCurrentLocation();
          }}
          aria-label={hasCoordinates ? "現在地から再取得" : "現在地から取得"}
          disabled={isLocating}
        >
          {isLocating
            ? "現在地を取得中..."
            : hasCoordinates
              ? "現在地から再取得"
              : "現在地から取得"}
        </button>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.confirm}
          onClick={handleConfirm}
          aria-label="決定"
          disabled={!effectiveSelected}
        >
          決定
        </button>
      </div>
    </div>
  );
}
