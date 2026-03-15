"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Location } from "@/actions/types";
import { getCurrentGpsPosition } from "@/lib/geolocation";
import styles from "../no-location/no-location.module.css";

type LocationOption = {
  id: string;
  label: string;
  distanceText?: string;
};

function formatDistance(distanceM: number): string {
  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toFixed(1)}km`;
  }
  return `${Math.round(distanceM)}m`;
}

function toLocationOptions(locations: Location[]): LocationOption[] {
  return locations.map((location) => {
    const trimmedName = location.name.trim();
    const distanceM = location.distance_m;

    return {
      id: location.id,
      label: trimmedName.length > 0 ? trimmedName : location.name,
      distanceText:
        typeof distanceM === "number" ? formatDistance(distanceM) : undefined,
    };
  });
}

function toGeolocationErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }

  return "位置情報の取得に失敗しました。";
}

function buildChangeLocationUrl(latitude: number, longitude: number): string {
  const searchParams = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
  });
  return `/change-location?${searchParams.toString()}`;
}

export default function ChangeLocationClient({
  locations,
  hasCoordinates,
}: {
  locations: Location[];
  hasCoordinates: boolean;
}) {
  const router = useRouter();
  const options = useMemo(() => toLocationOptions(locations), [locations]);
  const [selected, setSelected] = useState<string>(options[0]?.id ?? "");
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const nearbyCount = options.filter((option) => option.distanceText).length;

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
    router.push(`/board?locationId=${encodeURIComponent(effectiveSelected)}`);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>ロケーションカードを変更</h1>

      <section className={styles.selectArea}>
        <p className={styles.prompt}>ボードを選択してください</p>
        {hasCoordinates ? (
          nearbyCount > 0 ? (
            <p className={styles.prompt}>
              現在地に近いボードのみ表示しています。右側に距離を表示しています。
            </p>
          ) : (
            <p className={styles.prompt}>
              近くのボードが見つかりませんでした。再取得をお試しください。
            </p>
          )
        ) : (
          <p className={styles.prompt}>
            現在地から探す場合は「現在地から取得」を押してください。
          </p>
        )}
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
          <p className={styles.prompt}>近くのロケーションがありません。</p>
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
                      {option.distanceText ?? ""}
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
