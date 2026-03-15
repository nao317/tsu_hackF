"use client";

import React from "react";
import styles from "./selection-list.module.css";
import CloseButton from "../close-button";

export default function SelectionList({ items = [], onRemove }: { items?: string[]; onRemove?: () => void }) {
  return (
    <div className={styles.container} aria-live="polite">
      <h3 className={styles.label}>選択リスト</h3>
      <div className={styles.row}>
        <div className={styles.list}>
          {items.length ? items.map((t, i) => (
            <div key={i} className={styles.item}>{t}</div>
          )) : <div className={styles.empty}>まだ何も選択されていません</div>}
        </div>
        {items.length > 0 && (
          <div className={styles.removeWrap}>
            <CloseButton onClick={onRemove ?? (() => {})} />
          </div>
        )}
      </div>
    </div>
  );
}
