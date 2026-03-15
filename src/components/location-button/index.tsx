"use client";

import React, { useState } from "react";
import styles from "./location-button.module.css";
import { getCurrentGpsPosition } from "../../lib/geolocation";

// NOTE: Replace this component with Liftkit button after running LinkKit CLI:
// e.g. run `npm run add button` (or consult chainlift docs) then import the Liftkit component

export default function LocationButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const pos = await getCurrentGpsPosition({ enableHighAccuracy: true, timeout: 8000 });
      setLoading(false);
      const { latitude, longitude } = pos;
      window.location.href = `/board?lat=${latitude}&lng=${longitude}`;
    } catch (err: any) {
      setLoading(false);
      // 位置情報取得失敗時は代替ページへ遷移してボードを選べるようにする
      window.location.href = `/no-location`;
    }
  };

  return (
    <div>
      <button className={styles.btn} onClick={handleClick} aria-busy={loading}>
        {loading ? "現在地を取得中…" : "今の場所からボードを探す"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
