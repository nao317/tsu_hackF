"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { recommendSentenceAction } from "@/actions/ai";
import type { Card } from "@/actions/types";
import CardGrid from "../../components/card-grid";
import SelectionList from "../../components/selection-list";
import AiSuggestion from "../../components/ai-suggestion";
import SpeakButton from "../../components/speak-button";
import styles from "./board.module.css";

function toCardGridItems(cards: Card[]): Array<{ id: string; label: string }> {
  return cards
    .filter((card) => card.label.trim().length > 0)
    .map((card) => ({ id: card.id, label: card.label }));
}

export default function BoardClient({
  subtitle,
  dailyCards,
  locationCards,
  locationName,
}: {
  subtitle: string;
  dailyCards: Card[];
  locationCards: Card[];
  locationName?: string;
}) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedAi, setSelectedAi] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const dailyCardItems = useMemo(
    () => toCardGridItems(dailyCards),
    [dailyCards],
  );
  const locationCardItems = useMemo(
    () => toCardGridItems(locationCards),
    [locationCards],
  );

  const handleSelect = (label: string) => {
    setSelectedItems((prev) =>
      prev.includes(label) ? prev : [...prev, label],
    );
    setSelectedAi(null);
  };

  const handleRemoveLast = () => {
    setSelectedItems((prev) => {
      const next = prev.slice(0, -1);
      if (next.length === 0) {
        setAiSuggestion("");
        setAiError(null);
      }
      return next;
    });
  };

  const handleAiSelect = (text: string) => {
    setSelectedAi(text);
  };

  useEffect(() => {
    if (selectedItems.length === 0) {
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    (async () => {
      try {
        const response = await recommendSentenceAction({
          words: selectedItems,
          location_name: locationName,
        });

        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        setAiSuggestion(response.suggestions[0] ?? "");
        setAiError(null);
      } catch (error) {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "AIレコメンドの取得に失敗しました。";
        setAiSuggestion(message);
        setAiError(message);
      }
    })();
  }, [selectedItems, locationName]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>ボード</h2>
        <p className={styles.sub}>{subtitle}</p>
      </header>

      <section className={styles.daily}>
        <h3 className={styles.sectionTitle}>日常カード</h3>
        {dailyCardItems.length > 0 ? (
          <CardGrid
            cards={dailyCardItems}
            fullWidthFirst
            onSelect={handleSelect}
            selectedItems={selectedItems}
          />
        ) : (
          <p className={styles.empty}>日常カードの取得に失敗しました。</p>
        )}
      </section>

      <section className={styles.locationArea}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>ロケーションカード</h3>
          <a href="/change-location" className={styles.changeLink}>
            ロケーションカードを変更
          </a>
        </div>
        {locationCardItems.length > 0 ? (
          <CardGrid
            cards={locationCardItems}
            onSelect={handleSelect}
            selectedItems={selectedItems}
          />
        ) : (
          <p className={styles.empty}>
            このロケーションのカードはまだありません。
          </p>
        )}
      </section>

      <aside className={styles.sidebar}>
        <SelectionList items={selectedItems} onRemove={handleRemoveLast} />
        <AiSuggestion
          text={aiSuggestion}
          onSelect={aiSuggestion && !aiError ? handleAiSelect : undefined}
          selected={
            Boolean(aiSuggestion) && !aiError && selectedAi === aiSuggestion
          }
        />
        <SpeakButton text={selectedAi ?? selectedItems.join("")} />
      </aside>
    </div>
  );
}
