"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BOARDS_KEY = "tsu:boards";

function loadBoards(): string[] {
  try {
    const raw = localStorage.getItem(BOARDS_KEY);
    if (!raw) return ["コンビニ", "病院", "カフェ"];
    return JSON.parse(raw);
  } catch (e) {
    return ["コンビニ", "病院", "カフェ"];
  }
}

function cardsKey(board: string) {
  return `tsu:cards:${board}`;
}

export default function CardsPage() {
  const search = useSearchParams();
  const boardFromQuery = search?.get("board") || "";

  const [boards, setBoards] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(boardFromQuery || null);
  const [cards, setCards] = useState<string[]>([]);
  const [newCard, setNewCard] = useState("");

  useEffect(() => {
    setBoards(loadBoards());
  }, []);

  useEffect(() => {
    const board = selected;
    if (!board) return setCards([]);
    try {
      const raw = localStorage.getItem(cardsKey(board));
      if (!raw) return setCards([]);
      setCards(JSON.parse(raw));
    } catch (e) {
      setCards([]);
    }
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    try {
      localStorage.setItem(cardsKey(selected), JSON.stringify(cards));
    } catch (e) {}
  }, [cards, selected]);

  function addCard() {
    const n = newCard.trim();
    if (!n || !selected) return;
    setCards((c) => [...c, n]);
    setNewCard("");
  }

  function removeCard(idx: number) {
    const copy = [...cards];
    copy.splice(idx, 1);
    setCards(copy);
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
        <h2 style={{ margin: 0, textAlign: "center" }}>カード編集</h2>
      </div>

      <p style={{ color: "#444" }}>ボードを選択してください。</p>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
        {boards.map((b) => (
          <button
            key={b}
            onClick={() => setSelected(b)}
            style={{ padding: 10, borderRadius: 8, background: selected === b ? "#0369a1" : "#f1f5f9", color: selected === b ? "white" : "#111" }}
          >
            {b}
          </button>
        ))}
      </div>

      {selected ? (
        <section style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>{selected} のカード</h3>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={newCard} onChange={(e) => setNewCard(e.target.value)} placeholder="新しくカードを登録" style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc", background: "#F8FAFC", color: "#000" }} />
            <button onClick={addCard} style={{ padding: 10, borderRadius: 8, background: "#0b8457", color: "white" }}>＋</button>
          </div>

          <ul style={{ listStyle: "none", padding: 0 }}>
            {cards.map((c, i) => (
              <li key={`${c}-${i}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, background: "#f8fafc", borderRadius: 8, marginBottom: 8 }}>
                <span>{c}</span>
                <button onClick={() => removeCard(i)} style={{ padding: "6px 8px", background: "#ef4444", color: "white", borderRadius: 6 }}>✕</button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p style={{ color: "#666" }}>ボードを選ぶと、そのボードのカードがここに表示されます。</p>
      )}
    </div>
  );
}
