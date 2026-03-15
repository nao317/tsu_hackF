"use client";

import React from "react";
import styles from "./speak-button.module.css";

export default function SpeakButton({ text = "" }: { text?: string }) {
  const handleSpeak = () => {
    if (typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(text || "" );
    utter.lang = "ja-JP";
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  };

  return (
    <button className={styles.btn} onClick={handleSpeak} aria-label="発音">
      発音する
    </button>
  );
}
