"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import {
  createUserLocationAction,
  deleteUserLocationAction,
  getUserLocationsAction,
} from "@/actions/locations";
import type { Location } from "@/actions/types";
import { callWithAuthRetry } from "@/lib/authApiClient";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "処理に失敗しました。時間をおいて再度お試しください。";
}

function shouldRedirectLogin(message: string): boolean {
  return (
    message.includes("ログイン") ||
    message.includes("認証") ||
    message.includes("セッション")
  );
}

function toDisplayCoordinate(value: number | null | undefined): string {
  return typeof value === "number" ? value.toFixed(6) : "-";
}

export default function BoardsPage() {
  const router = useRouter();
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState("");
  const [latitude, setLatitude] = React.useState("");
  const [longitude, setLongitude] = React.useState("");
  const [radiusM, setRadiusM] = React.useState("200");
  const safeLocations = Array.isArray(locations) ? locations : [];

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const userLocations = await callWithAuthRetry((accessToken) =>
          getUserLocationsAction(accessToken),
        );

        if (!cancelled) {
          setLocations(Array.isArray(userLocations) ? userLocations : []);
        }
      } catch (error) {
        const message = getErrorMessage(error);
        if (!cancelled) {
          setErrorMessage(message);
          if (shouldRedirectLogin(message)) {
            router.replace("/login");
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("このブラウザでは位置情報を利用できません。");
      return;
    }

    setErrorMessage(null);
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setIsLocating(false);
      },
      () => {
        setErrorMessage("現在地の取得に失敗しました。入力値をご確認ください。");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newName.trim();
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedRadius = Number(radiusM);

    if (!trimmedName) {
      setErrorMessage("ロケーション名を入力してください。");
      return;
    }
    if (!Number.isFinite(parsedLatitude)) {
      setErrorMessage("緯度を正しく入力してください。");
      return;
    }
    if (!Number.isFinite(parsedLongitude)) {
      setErrorMessage("経度を正しく入力してください。");
      return;
    }
    if (!Number.isFinite(parsedRadius) || parsedRadius <= 0) {
      setErrorMessage("判定半径は 1 以上の数値を入力してください。");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const created = await callWithAuthRetry((accessToken) =>
        createUserLocationAction(
          {
            name: trimmedName,
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            radius_m: parsedRadius,
          },
          accessToken,
        ),
      );

      setLocations((prev) => [...(Array.isArray(prev) ? prev : []), created]);
      setNewName("");
      setLatitude("");
      setLongitude("");
      setRadiusM("200");
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      if (shouldRedirectLogin(message)) {
        router.replace("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (locationId: string, locationName: string) => {
    if (!window.confirm(`「${locationName}」を削除しますか？`)) {
      return;
    }

    setErrorMessage(null);
    setDeletingId(locationId);

    try {
      await callWithAuthRetry((accessToken) =>
        deleteUserLocationAction(locationId, accessToken),
      );

      setLocations((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (location) => location.id !== locationId,
        ),
      );
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      if (shouldRedirectLogin(message)) {
        router.replace("/login");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: 16, position: "relative", minHeight: "100vh" }}>
      <button
        onClick={() => router.push("/login-form")}
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "transparent",
          border: "none",
          color: "#0369a1",
          textDecoration: "underline",
          padding: 0,
          fontSize: 16,
          cursor: "pointer",
        }}
        aria-label="戻る"
      >
        ←戻る
      </button>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <h2 style={{ margin: 0, textAlign: "center" }}>ボード編集</h2>
      </div>

      <p style={{ color: "#444" }}>
        ログインユーザー向けロケーションを追加・削除してください。
      </p>

      {errorMessage ? (
        <p
          role="alert"
          style={{
            padding: 10,
            borderRadius: 8,
            background: "#fef2f2",
            color: "#b91c1c",
            marginBottom: 12,
          }}
        >
          {errorMessage}
        </p>
      ) : null}

      <form onSubmit={handleCreate} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="新しくロケーションを登録"
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#F8FAFC",
              color: "#000",
            }}
          />
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            style={{
              padding: 10,
              borderRadius: 8,
              background: "#0369a1",
              color: "white",
              border: "none",
            }}
          >
            {isLocating ? "取得中..." : "現在地を使う"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            placeholder="緯度"
            inputMode="decimal"
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#F8FAFC",
              color: "#000",
            }}
          />
          <input
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            placeholder="経度"
            inputMode="decimal"
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#F8FAFC",
              color: "#000",
            }}
          />
          <input
            value={radiusM}
            onChange={(event) => setRadiusM(event.target.value)}
            placeholder="判定半径(m)"
            inputMode="numeric"
            style={{
              width: 120,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#F8FAFC",
              color: "#000",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: 10,
            borderRadius: 8,
            background: "#0b8457",
            color: "white",
            border: "none",
          }}
        >
          {isSubmitting ? "追加中..." : "＋ ロケーション追加"}
        </button>
      </form>

      {isLoading ? <p>ロケーションを読み込み中です...</p> : null}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {safeLocations.map((location) => (
          <li
            key={location.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 10,
              borderRadius: 8,
              background: "#f7f7f7",
              marginBottom: 8,
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{location.name}</div>
              <div style={{ fontSize: 13, color: "#475569" }}>
                緯度: {toDisplayCoordinate(location.latitude)} / 経度:{" "}
                {toDisplayCoordinate(location.longitude)} / 半径:{" "}
                {location.radius_m ?? 200}m
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href={`/edit/cards?locationId=${encodeURIComponent(location.id)}`}
                style={{
                  padding: "6px 8px",
                  background: "#0369a1",
                  color: "white",
                  borderRadius: 6,
                }}
              >
                カード編集
              </Link>
              <button
                onClick={() => {
                  void handleDelete(location.id, location.name);
                }}
                disabled={deletingId === location.id}
                aria-label={`削除 ${location.name}`}
                style={{
                  padding: "6px 8px",
                  background: "#e11d48",
                  color: "white",
                  borderRadius: 6,
                  border: "none",
                }}
              >
                {deletingId === location.id ? "削除中..." : "✕"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!isLoading && safeLocations.length === 0 ? (
        <p style={{ color: "#666" }}>
          まだロケーションがありません。上のフォームから追加してください。
        </p>
      ) : null}
    </div>
  );
}
