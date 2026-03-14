"use client";

import Link from "next/link";
import { useState } from "react";
import {
  type GeolocationErrorCode,
  type GpsPosition,
  getCurrentGpsPosition,
} from "@/lib/geolocation";
import styles from "./page.module.css";

const formatNumber = (value: number | null, digit = 6) => {
  if (value === null) {
    return "-";
  }

  return value.toFixed(digit);
};

const errorLabel: Record<GeolocationErrorCode, string> = {
  UNSUPPORTED: "UNSUPPORTED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  POSITION_UNAVAILABLE: "POSITION_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",
  UNKNOWN: "UNKNOWN",
};

export default function GpsTestPage() {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<GeolocationErrorCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetGps = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setErrorCode(null);

    try {
      const gps = await getCurrentGpsPosition();
      setPosition(gps);
    } catch (error) {
      setPosition(null);

      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        "code" in error
      ) {
        setErrorMessage(String(error.message));
        setErrorCode(error.code as GeolocationErrorCode);
      } else {
        setErrorMessage("位置情報の取得に失敗しました。");
        setErrorCode("UNKNOWN");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearResult = () => {
    setPosition(null);
    setErrorMessage(null);
    setErrorCode(null);
  };

  return (
    <div className={styles.page}>
      <main className={styles.panel}>
        <h1 className={styles.title}>GPS テストページ</h1>
        <p className={styles.description}>
          Geolocation API
          から現在地を取得して表示します。ボタン押下時にブラウザの位置情報許可が求められます。
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleGetGps}
            disabled={isLoading}
            className={styles.primaryButton}
          >
            {isLoading ? "取得中..." : "現在地を取得"}
          </button>
          <button
            type="button"
            onClick={clearResult}
            className={styles.secondaryButton}
          >
            クリア
          </button>
          <Link href="/" className={styles.secondaryButton}>
            トップへ戻る
          </Link>
        </div>

        {errorMessage ? (
          <div className={styles.error}>
            {errorCode ? `[${errorLabel[errorCode]}] ` : ""}
            {errorMessage}
          </div>
        ) : null}

        {position ? (
          <pre className={styles.result}>
            {`latitude: ${formatNumber(position.latitude)}
longitude: ${formatNumber(position.longitude)}
accuracy(m): ${formatNumber(position.accuracy, 2)}
altitude(m): ${formatNumber(position.altitude, 2)}
altitudeAccuracy(m): ${formatNumber(position.altitudeAccuracy, 2)}
heading(deg): ${formatNumber(position.heading, 2)}
speed(m/s): ${formatNumber(position.speed, 2)}
timestamp: ${new Date(position.timestamp).toISOString()}`}
          </pre>
        ) : (
          <p className={styles.placeholder}>
            まだ位置情報は取得されていません。
          </p>
        )}
      </main>
    </div>
  );
}
