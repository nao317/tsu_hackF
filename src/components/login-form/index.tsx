"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { getMeAction, loginAction } from "@/actions/auth";
import {
  clearStoredAuth,
  setStoredAuthTokens,
  setStoredAuthUser,
} from "@/lib/authStorage";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "ログインに失敗しました。入力内容をご確認ください。";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const isRegistered = searchParams.get("registered") === "1";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const tokens = await loginAction({
        email: email.trim(),
        password,
      });

      setStoredAuthTokens(tokens);

      try {
        const me = await getMeAction(tokens.access_token);
        setStoredAuthUser(me);
      } catch {
        clearStoredAuth();
        throw new Error(
          "ログイン情報の取得に失敗しました。再度お試しください。",
        );
      }

      router.push("/login-form");
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 16 }}>
      <h2 style={{ fontSize: 20, marginBottom: 8, textAlign: "center" }}>
        ログイン
      </h2>
      <p>編集するにはログインが必要です。</p>

      {isRegistered ? (
        <p
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background: "#ecfeff",
            color: "#0f766e",
          }}
        >
          サインアップが完了しました。ログインしてください。
        </p>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {errorMessage}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} aria-label="login-form">
        <label style={{ display: "block", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>メールアドレス</div>
          <input
            type="email"
            name="email"
            placeholder="example@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#F8FAFC",
              color: "#000",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>パスワード</div>
          <input
            type="password"
            name="password"
            placeholder="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#F8FAFC",
              color: "#000",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            background: "#0078d4",
            color: "white",
            fontWeight: 700,
          }}
        >
          {isSubmitting ? "ログイン中..." : "ログイン"}
        </button>

        <p style={{ marginTop: 12, textAlign: "center" }}>
          アカウントをお持ちでない場合は{" "}
          <Link href="/signup">サインアップ</Link>
        </p>
      </form>
    </div>
  );
}
