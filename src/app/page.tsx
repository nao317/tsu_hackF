"use client";

import Image from "next/image";
// Link removed; using a client-side location button instead
import styles from "./page.module.css";
import EditEntry from "../components/edit-entry";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
    
        <div className={styles.intro}>
          <h1>いいかんじのアプリ名</h1>
          <p>現在地に合わせたカードで素早く発話を支援します。</p>
        </div>

        <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) {
                alert("位置情報にアクセスできません。");
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords;
                  window.location.href = `/board?lat=${latitude}&lng=${longitude}`;
                },
                () => {
                  alert("位置情報を取得できませんでした。");
                }
              );
            }}
            style={{ display: "inline-block", padding: 12, borderRadius: 8, background: "#0b5cff", color: "white", textAlign: "center", fontWeight: 600 }}
          >
            今の場所からボードを探す
          </button>

          <EditEntry />
        </div>
      </main>
    </div>
  );
}
