"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getMeAction, logoutAction, refreshTokenAction } from "@/actions/auth";
import {
  clearStoredAuth,
  getStoredAuthTokens,
  setStoredAuthTokens,
  setStoredAuthUser,
} from "@/lib/authStorage";

export default function LoginSelectionPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [displayName, setDisplayName] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const stored = getStoredAuthTokens();

      if (!stored) {
        router.replace("/login");
        return;
      }

      try {
        const me = await getMeAction(stored.access_token);
        if (cancelled) {
          return;
        }

        setStoredAuthUser(me);
        setDisplayName(me.display_name);
        setIsChecking(false);
      } catch {
        try {
          const refreshed = await refreshTokenAction({
            refresh_token: stored.refresh_token,
          });

          if (cancelled) {
            return;
          }

          setStoredAuthTokens(refreshed);
          const me = await getMeAction(refreshed.access_token);

          if (cancelled) {
            return;
          }

          setStoredAuthUser(me);
          setDisplayName(me.display_name);
          setIsChecking(false);
        } catch {
          clearStoredAuth();
          if (!cancelled) {
            router.replace("/login");
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    const stored = getStoredAuthTokens();
    setIsLoggingOut(true);

    if (stored) {
      try {
        await logoutAction(
          { refresh_token: stored.refresh_token },
          stored.access_token,
        );
      } catch {
        // セッション破棄を優先するため、APIエラー時もローカル状態は削除する。
      }
    }

    clearStoredAuth();
    router.replace("/login");
  };

  if (isChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p>ログイン状態を確認しています...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          width: "100%",
          maxWidth: 420,
        }}
      >
        <h1 style={{ margin: 0, textAlign: "center" }}>編集メニュー</h1>
        {displayName ? (
          <p style={{ margin: 0, color: "#334155" }}>
            ログイン中: {displayName}
          </p>
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
          }}
        >
          <button
            type="button"
            onClick={() => router.push("/edit/boards")}
            style={{
              padding: 14,
              borderRadius: 10,
              background: "#0b8457",
              color: "#fff",
              fontWeight: 700,
              border: "none",
            }}
          >
            ボード編集
          </button>

          <button
            type="button"
            onClick={() => router.push("/edit/cards")}
            style={{
              padding: 14,
              borderRadius: 10,
              background: "#b45309",
              color: "#fff",
              fontWeight: 700,
              border: "none",
            }}
          >
            カード編集
          </button>

          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
            disabled={isLoggingOut}
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#475569",
              color: "#fff",
              fontWeight: 700,
              border: "none",
            }}
          >
            {isLoggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </div>
      </div>
    </div>
  );
}
