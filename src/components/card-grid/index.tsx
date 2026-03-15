"use client";

import React from "react";
import styles from "./card-grid.module.css";

type Card = { id: string; label: string };

export default function CardGrid({ cards = [], fullWidthFirst = false, onSelect, selectedItems = [], }: { cards?: Card[]; fullWidthFirst?: boolean; onSelect?: (label: string) => void; selectedItems?: string[] }) {
  // Default sample cards for demo
  const sample = cards.length ? cards : [
    { id: "1", label: "おにぎり" },
    { id: "2", label: "ください" },
    { id: "3", label: "袋" },
    { id: "4", label: "ありがとう" },
  ];

  return (
    <div className={styles.grid} role="list">
      {sample.map((c, idx) => {
        const isSelected = selectedItems.includes(c.label);
        return (
          <button
            key={c.id}
            className={`${styles.card} ${fullWidthFirst && idx === 0 ? styles.full : ""} ${isSelected ? styles.selected : ""}`}
            role="listitem"
            aria-label={c.label}
            aria-pressed={isSelected}
            onClick={() => onSelect?.(c.label)}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
