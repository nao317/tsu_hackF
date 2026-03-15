"use client";

import React from "react";
import styles from "./close-button.module.css";

export default function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button className={styles.btn} aria-label="選択リストから最後のカードを削除" onClick={onClick}>
      ×
    </button>
  );
}
