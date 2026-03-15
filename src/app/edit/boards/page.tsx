"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "tsu:boards";

function loadBoards(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ["コンビニ", "病院", "カフェ"];
    return JSON.parse(raw);
  } catch (e) {
    return ["コンビニ", "病院", "カフェ"];
  }
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setBoards(loadBoards());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
    } catch (e) {}
  }, [boards]);

  function addBoard() {
    const name = newName.trim();
    if (!name) return;
    if (boards.includes(name)) {
      setNewName("");
      return;
    }
    setBoards([...boards, name]);
    setNewName("");
  }

  function removeBoard(idx: number) {
    const copy = [...boards];
    copy.splice(idx, 1);
    setBoards(copy);
  }

  const router = useRouter();

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

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <h2 style={{ margin: 0, textAlign: "center" }}>ボード編集</h2>
      </div>

      <p style={{ color: "#444" }}>ロケーション（ボード）を追加・削除してください。</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="新しくロケーションを登録" style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc", background: "#F8FAFC", color: "#000" }} />
        <button onClick={addBoard} style={{ padding: 10, borderRadius: 8, background: "#0b8457", color: "white" }}>＋</button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {boards.map((b, i) => (
          <li key={b} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8, background: "#f7f7f7", marginBottom: 8 }}>
            <span>{b}</span>
            <div style={{ display: "flex", gap: 8 }}>
             <Link 
  href={`/edit/cards?board=${encodeURIComponent(b)}`}
  style={{ padding: "6px 8px", background: "#0369a1", color: "white", borderRadius: 6 }}
>
  編集
</Link>
              <button onClick={() => removeBoard(i)} aria-label={`削除 ${b}`} style={{ padding: "6px 8px", background: "#e11d48", color: "white", borderRadius: 6 }}>✕</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
