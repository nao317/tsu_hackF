"use client";

import { use } from 'react';
import React, { useState } from "react";
import CardGrid from "../../components/card-grid";
import SelectionList from "../../components/selection-list";
import AiSuggestion from "../../components/ai-suggestion";
import SpeakButton from "../../components/speak-button";
import styles from "./board.module.css";

export default function BoardPage({ searchParams }: { searchParams: Promise<{ lat: string, lng: string, board: string }> }) {
  const params  = use(searchParams);
  const lat = params?.lat;
  const lng = params?.lng;
  const board = params?.board;
  const BOARD_LABELS: Record<string, string> = {
    convenience: "コンビニ",
    hospital: "病院",
    cafe: "カフェ",
  };
  const boardLabel = board ? BOARD_LABELS[board] ?? board : null;

  const getGreeting = () => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const morningStart = 4 * 60; // 4:00
    const morningEnd = 11 * 60; // 11:00
    const afternoonStart = 11 * 60 + 1; // 11:01
    const afternoonEnd = 18 * 60; // 18:00
    if (mins >= morningStart && mins <= morningEnd) return "おはようございます";
    if (mins >= afternoonStart && mins <= afternoonEnd) return "こんにちは";
    return "こんばんは";
  };
  const greetingLabel = getGreeting();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const handleSelect = (label: string) => {
    setSelectedItems((prev) => (prev.includes(label) ? prev : [...prev, label]));
    // clear AI selection when user taps normal cards
    setSelectedAi(null);
  };
  const handleRemoveLast = () => {
    setSelectedItems((prev) => prev.slice(0, -1));
  };
  const [selectedAi, setSelectedAi] = useState<string | null>(null);
  const handleAiSelect = (text: string) => {
    setSelectedAi(text);
  };

  // For MVP we show sample cards and areas. Integration with backend/AI TBD.
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>ボード</h2>
        <p className={styles.sub}>{boardLabel ? `選択ボード: ${boardLabel}` : lat ? `現在地: ${lat}, ${lng}` : "未指定"}</p>
      </header>

      <section className={styles.daily}>
        <h3 className={styles.sectionTitle}>日常カード</h3>
        <CardGrid
          cards={[
            { id: 'top', label: '音声アプリで会話します。少しお待ちください' },
            { id: 'greet', label: greetingLabel },
            { id: 'wait', label: 'すこしまってください' },
            { id: 'thanks', label: 'ありがとうございます' },
          ]}
          fullWidthFirst
          onSelect={handleSelect}
          selectedItems={selectedItems}
        />
      </section>

      <section className={styles.locationArea}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>ロケーションカード</h3>
          <a href="/change-location" className={styles.changeLink}>ロケーションカードを変更</a>
        </div>
        <CardGrid onSelect={handleSelect} selectedItems={selectedItems} />
      </section>

      <aside className={styles.sidebar}>
        <SelectionList items={selectedItems} onRemove={handleRemoveLast} />
        <AiSuggestion text={"おにぎりをください"} onSelect={handleAiSelect} selected={selectedAi === "おにぎりをください"} />
        <SpeakButton text={selectedAi ?? selectedItems.join("")} />
      </aside>
    </div>
  );
}
