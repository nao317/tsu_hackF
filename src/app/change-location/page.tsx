"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../no-location/no-location.module.css";

const BOARDS = [
  { id: "convenience", label: "コンビニ" },
  { id: "hospital", label: "病院" },
  { id: "cafe", label: "カフェ" },
];

export default function ChangeLocationPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(BOARDS[0].id);

  const handleConfirm = () => {
    router.push(`/board?board=${encodeURIComponent(selected)}`);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>ロケーションカードを変更</h1>

      <section className={styles.selectArea}>
        <p className={styles.prompt}>ボードを選択してください</p>
        <ul className={styles.list} role="list">
          {BOARDS.map((b) => (
            <li key={b.id} className={styles.item}>
              <label>
                <input
                  type="radio"
                  name="board"
                  value={b.id}
                  checked={selected === b.id}
                  onChange={() => setSelected(b.id)}
                />
                <span className={styles.labelText}>{b.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.actions}>
        <button className={styles.confirm} onClick={handleConfirm} aria-label="決定">決定</button>
      </div>
    </div>
  );
}
