"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Location } from "@/actions/types";
import styles from "../no-location/no-location.module.css";

type LocationOption = {
  id: string;
  label: string;
};

function toLocationOptions(locations: Location[]): LocationOption[] {
  return locations.map((location) => {
    const trimmedName = location.name.trim();
    return {
      id: location.id,
      label: trimmedName.length > 0 ? trimmedName : location.name,
    };
  });
}

export default function ChangeLocationClient({
  locations,
}: {
  locations: Location[];
}) {
  const router = useRouter();
  const options = useMemo(() => toLocationOptions(locations), [locations]);
  const [selected, setSelected] = useState<string>(options[0]?.id ?? "");

  const handleConfirm = () => {
    if (!selected) {
      return;
    }
    router.push(`/board?locationId=${encodeURIComponent(selected)}`);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>ロケーションカードを変更</h1>

      <section className={styles.selectArea}>
        <p className={styles.prompt}>ボードを選択してください</p>
        {options.length === 0 ? (
          <p className={styles.prompt}>利用可能なロケーションがありません。</p>
        ) : (
          <ul className={styles.list} role="list">
            {options.map((option) => (
              <li key={option.id} className={styles.item}>
                <label>
                  <input
                    type="radio"
                    name="board"
                    value={option.id}
                    checked={selected === option.id}
                    onChange={() => setSelected(option.id)}
                  />
                  <span className={styles.labelText}>{option.label}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className={styles.actions}>
        <button
          className={styles.confirm}
          onClick={handleConfirm}
          aria-label="決定"
          disabled={!selected}
        >
          決定
        </button>
      </div>
    </div>
  );
}
