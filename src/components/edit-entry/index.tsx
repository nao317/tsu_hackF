"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getStoredAuthTokens } from "@/lib/authStorage";

export default function EditEntry() {
  const router = useRouter();

  const handleClick = () => {
    const tokens = getStoredAuthTokens();
    router.push(tokens ? "/login-form" : "/login");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        onClick={handleClick}
        style={{
          padding: 12,
          borderRadius: 10,
          background: "#0369a1",
          color: "#fff",
          fontWeight: 700,
        }}
      >
        編集
      </button>
    </div>
  );
}
