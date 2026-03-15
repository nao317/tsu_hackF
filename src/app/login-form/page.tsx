"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function LoginSelectionPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%", maxWidth: 420 }}>
        <h1 style={{ margin: 0, textAlign: "center" }}>編集メニュー</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          <button
            type="button"
            onClick={() => router.push("/edit/boards")}
            style={{ padding: 14, borderRadius: 10, background: "#0b8457", color: "#fff", fontWeight: 700, border: "none" }}
          >
            ボード編集
          </button>

          <button
            type="button"
            onClick={() => router.push("/edit/cards")}
            style={{ padding: 14, borderRadius: 10, background: "#b45309", color: "#fff", fontWeight: 700, border: "none" }}
          >
            カード編集
          </button>
        </div>
      </div>
    </div>
  );
}
