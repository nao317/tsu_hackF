"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function EditEntry() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        onClick={() => router.push("/login")}
        style={{ padding: 12, borderRadius: 10, background: "#0369a1", color: "#fff", fontWeight: 700 }}
      >
        編集
      </button>
    </div>
  );
}
