"use client";

import React from "react";
import styles from "./ai-suggestion.module.css";

export default function AiSuggestion({ text = "", onSelect, selected = false }: { text?: string; onSelect?: (text: string) => void; selected?: boolean }) {
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    onSelect?.(text || "");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(text || "");
    }
  };

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>AIレコメンド</h4>
      <button
        type="button"
        className={`${styles.box} ${selected ? styles.selected : ""}`}
        aria-pressed={selected}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.preventDefault()}
      >
        {text || "候補がここに表示されます"}
      </button>
    </div>
  );
}
