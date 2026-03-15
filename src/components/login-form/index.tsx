"use client";

import React from "react";

export default function LoginForm() {
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 16 }}>
      <h2 style={{ fontSize: 20, marginBottom: 8, textAlign: "center" }}>ログイン</h2>
      <p>編集するにはログインが必要です。</p>
      <form onSubmit={(e) => e.preventDefault()} aria-label="login-form">
        <label style={{ display: "block", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>メールアドレス</div>
          <input
            type="email"
            placeholder="example@example.com"
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", background: "#F8FAFC", color: "#000" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>パスワード</div>
          <input
            type="password"
            placeholder="password"
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", background: "#F8FAFC", color: "#000" }}
          />
        </label>

        <button
          type="submit"
          style={{ width: "100%", padding: 12, borderRadius: 8, background: "#0078d4", color: "white", fontWeight: 700 }}
        >
          ログイン
        </button>
      </form>
    </div>
  );
}
