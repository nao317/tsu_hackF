"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signupAction } from "@/actions/auth";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "サインアップに失敗しました。入力内容をご確認ください。";
}

export default function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirm, setPasswordConfirm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== passwordConfirm) {
      setErrorMessage("パスワードが一致しません。");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signupAction({
        email: email.trim(),
        password,
        display_name: displayName.trim(),
      });

      router.push("/login?registered=1");
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 16 }}>
      <h2 style={{ fontSize: 20, marginBottom: 8, textAlign: "center" }}>
        サインアップ
      </h2>
      <p>新規アカウントを作成します。</p>

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

      <form onSubmit={handleSubmit} aria-label="signup-form">
        <label style={{ display: "block", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>表示名</div>
          <input
            type="text"
            name="display_name"
            placeholder="山田 太郎"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
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
            placeholder="8文字以上"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
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
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            パスワード（確認）
          </div>
          <input
            type="password"
            name="password_confirm"
            placeholder="もう一度入力"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            minLength={8}
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
            background: "#0b8457",
            color: "white",
            fontWeight: 700,
          }}
        >
          {isSubmitting ? "登録中..." : "サインアップ"}
        </button>

        <p style={{ marginTop: 12, textAlign: "center" }}>
          既にアカウントをお持ちの場合は <Link href="/login">ログイン</Link>
        </p>
      </form>
    </div>
  );
}
