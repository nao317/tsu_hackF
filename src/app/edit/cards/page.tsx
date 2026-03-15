"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addCardToUserLocationAction,
  createUserCardAction,
  getDailyCardsAction,
  removeCardFromUserLocationAction,
  reorderUserLocationCardsAction,
} from "@/actions/cards";
import {
  getUserLocationCardsAction,
  getUserLocationsAction,
} from "@/actions/locations";
import type { Card, Location } from "@/actions/types";
import { callWithAuthRetry } from "@/lib/authApiClient";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "処理に失敗しました。時間をおいて再度お試しください。";
}

function shouldRedirectLogin(message: string): boolean {
  return (
    message.includes("ログイン") ||
    message.includes("認証") ||
    message.includes("セッション")
  );
}

export default function CardsPage() {
  const search = useSearchParams();
  const router = useRouter();
  const locationIdFromQuery = search?.get("locationId") ?? "";

  const [locations, setLocations] = React.useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = React.useState("");
  const [cards, setCards] = React.useState<Card[]>([]);
  const [dailyCards, setDailyCards] = React.useState<Card[]>([]);
  const [isBootLoading, setIsBootLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [addingCardId, setAddingCardId] = React.useState<string | null>(null);
  const [removingCardId, setRemovingCardId] = React.useState<string | null>(
    null,
  );
  const [movingCardId, setMovingCardId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [newCardLabel, setNewCardLabel] = React.useState("");
  const [newCardEmoji, setNewCardEmoji] = React.useState("");
  const [newCardCategory, setNewCardCategory] = React.useState("");

  const safeLocations = React.useMemo(
    () => (Array.isArray(locations) ? locations : []),
    [locations],
  );
  const safeCards = React.useMemo(
    () => (Array.isArray(cards) ? cards : []),
    [cards],
  );
  const safeDailyCards = React.useMemo(
    () => (Array.isArray(dailyCards) ? dailyCards : []),
    [dailyCards],
  );

  const selectedLocation = React.useMemo(
    () => safeLocations.find((location) => location.id === selectedLocationId),
    [safeLocations, selectedLocationId],
  );

  const existingCardIds = React.useMemo(
    () => new Set(safeCards.map((card) => card.id)),
    [safeCards],
  );

  const addableDailyCards = React.useMemo(
    () => safeDailyCards.filter((card) => !existingCardIds.has(card.id)),
    [safeDailyCards, existingCardIds],
  );

  const loadCards = React.useCallback(async (locationId: string) => {
    const loadedCards = await callWithAuthRetry((accessToken) =>
      getUserLocationCardsAction(locationId, accessToken),
    );
    setCards(Array.isArray(loadedCards) ? loadedCards : []);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [userLocations, daily] = await Promise.all([
          callWithAuthRetry((accessToken) =>
            getUserLocationsAction(accessToken),
          ),
          getDailyCardsAction(),
        ]);

        if (cancelled) {
          return;
        }

        const normalizedLocations = Array.isArray(userLocations)
          ? userLocations
          : [];

        setLocations(normalizedLocations);
        setDailyCards(Array.isArray(daily) ? daily : []);

        const initialLocationId =
          normalizedLocations.find(
            (location) => location.id === locationIdFromQuery,
          )?.id ?? normalizedLocations[0]?.id;

        if (initialLocationId) {
          setSelectedLocationId(initialLocationId);
          await loadCards(initialLocationId);
        }
      } catch (error) {
        const message = getErrorMessage(error);
        if (!cancelled) {
          setErrorMessage(message);
          if (shouldRedirectLogin(message)) {
            router.replace("/login");
          }
        }
      } finally {
        if (!cancelled) {
          setIsBootLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadCards, locationIdFromQuery, router]);

  const handleSelectLocation = async (locationId: string) => {
    setSelectedLocationId(locationId);
    setErrorMessage(null);

    try {
      await loadCards(locationId);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      if (shouldRedirectLogin(message)) {
        router.replace("/login");
      }
    }
  };

  const handleCreateCard = async () => {
    const trimmedLabel = newCardLabel.trim();
    if (!selectedLocationId) {
      setErrorMessage("先にロケーションを選択してください。");
      return;
    }
    if (!trimmedLabel) {
      setErrorMessage("カード名を入力してください。");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const createdCard = await callWithAuthRetry((accessToken) => {
        const formData = new FormData();
        formData.append("label", trimmedLabel);

        const emoji = newCardEmoji.trim();
        if (emoji) {
          formData.append("emoji", emoji);
        }

        const category = newCardCategory.trim();
        if (category) {
          formData.append("category", category);
        }

        return createUserCardAction(formData, accessToken);
      });

      await callWithAuthRetry((accessToken) =>
        addCardToUserLocationAction(
          selectedLocationId,
          {
            card_id: createdCard.id,
            sort_order: safeCards.length,
          },
          accessToken,
        ),
      );

      await loadCards(selectedLocationId);
      setNewCardLabel("");
      setNewCardEmoji("");
      setNewCardCategory("");
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      if (shouldRedirectLogin(message)) {
        router.replace("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDailyCard = async (cardId: string) => {
    if (!selectedLocationId) {
      setErrorMessage("先にロケーションを選択してください。");
      return;
    }

    setErrorMessage(null);
    setAddingCardId(cardId);

    try {
      await callWithAuthRetry((accessToken) =>
        addCardToUserLocationAction(
          selectedLocationId,
          {
            card_id: cardId,
            sort_order: safeCards.length,
          },
          accessToken,
        ),
      );

      await loadCards(selectedLocationId);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      if (shouldRedirectLogin(message)) {
        router.replace("/login");
      }
    } finally {
      setAddingCardId(null);
    }
  };

  const handleRemoveCard = async (cardId: string) => {
    if (!selectedLocationId) {
      return;
    }

    setErrorMessage(null);
    setRemovingCardId(cardId);

    try {
      await callWithAuthRetry((accessToken) =>
        removeCardFromUserLocationAction(
          selectedLocationId,
          cardId,
          accessToken,
        ),
      );
      await loadCards(selectedLocationId);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      if (shouldRedirectLogin(message)) {
        router.replace("/login");
      }
    } finally {
      setRemovingCardId(null);
    }
  };

  const handleMoveCard = async (index: number, direction: -1 | 1) => {
    if (!selectedLocationId) {
      return;
    }

    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= safeCards.length) {
      return;
    }

    const currentCards = [...safeCards];
    const nextCards = [...safeCards];
    [nextCards[index], nextCards[nextIndex]] = [
      nextCards[nextIndex],
      nextCards[index],
    ];

    setCards(nextCards);
    setMovingCardId(nextCards[nextIndex].id);
    setErrorMessage(null);

    try {
      await callWithAuthRetry((accessToken) =>
        reorderUserLocationCardsAction(
          selectedLocationId,
          {
            cards: nextCards.map((card, sortOrder) => ({
              card_id: card.id,
              sort_order: sortOrder,
            })),
          },
          accessToken,
        ),
      );
    } catch (error) {
      setCards(currentCards);
      const message = getErrorMessage(error);
      setErrorMessage(message);
      if (shouldRedirectLogin(message)) {
        router.replace("/login");
      }
    } finally {
      setMovingCardId(null);
    }
  };

  return (
    <div style={{ padding: 16, position: "relative", minHeight: "100vh" }}>
      <button
        onClick={() => router.push("/login-form")}
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "transparent",
          border: "none",
          color: "#0369a1",
          textDecoration: "underline",
          padding: 0,
          fontSize: 16,
          cursor: "pointer",
        }}
        aria-label="戻る"
      >
        ←戻る
      </button>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <h2 style={{ margin: 0, textAlign: "center" }}>カード編集</h2>
      </div>

      <p style={{ color: "#444" }}>
        ログインユーザーのロケーションに紐づくカードを編集できます。
      </p>

      {errorMessage ? (
        <p
          role="alert"
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {errorMessage}
        </p>
      ) : null}

      {isBootLoading ? <p>データを読み込み中です...</p> : null}

      <div
        style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}
      >
        {safeLocations.map((location) => (
          <button
            key={location.id}
            onClick={() => {
              void handleSelectLocation(location.id);
            }}
            style={{
              padding: 10,
              borderRadius: 8,
              background:
                selectedLocationId === location.id ? "#0369a1" : "#f1f5f9",
              color: selectedLocationId === location.id ? "white" : "#111",
              border: "none",
            }}
          >
            {location.name}
          </button>
        ))}
      </div>

      {!isBootLoading && safeLocations.length === 0 ? (
        <div>
          <p style={{ color: "#666" }}>
            編集対象のロケーションがありません。先にボード編集で追加してください。
          </p>
          <button
            onClick={() => router.push("/edit/boards")}
            style={{
              padding: 10,
              borderRadius: 8,
              border: "none",
              background: "#0369a1",
              color: "white",
            }}
          >
            ボード編集へ移動
          </button>
        </div>
      ) : null}

      {selectedLocation ? (
        <section style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>{selectedLocation.name} のカード</h3>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={newCardLabel}
              onChange={(event) => setNewCardLabel(event.target.value)}
              placeholder="新しくカードを登録"
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
                background: "#F8FAFC",
                color: "#000",
              }}
            />
            <input
              value={newCardEmoji}
              onChange={(event) => setNewCardEmoji(event.target.value)}
              placeholder="絵文字(任意)"
              style={{
                width: 120,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
                background: "#F8FAFC",
                color: "#000",
              }}
            />
            <input
              value={newCardCategory}
              onChange={(event) => setNewCardCategory(event.target.value)}
              placeholder="カテゴリ(任意)"
              style={{
                width: 160,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
                background: "#F8FAFC",
                color: "#000",
              }}
            />
            <button
              onClick={() => {
                void handleCreateCard();
              }}
              disabled={isSubmitting}
              style={{
                padding: 10,
                borderRadius: 8,
                background: "#0b8457",
                color: "white",
                border: "none",
              }}
            >
              {isSubmitting ? "追加中..." : "＋"}
            </button>
          </div>

          {addableDailyCards.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              <p style={{ marginTop: 0, color: "#475569" }}>日常カードを追加</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {addableDailyCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => {
                      void handleAddDailyCard(card.id);
                    }}
                    disabled={addingCardId === card.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #94a3b8",
                      background: "#f8fafc",
                    }}
                  >
                    {addingCardId === card.id ? "追加中..." : card.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <ul style={{ listStyle: "none", padding: 0 }}>
            {safeCards.map((card, index) => (
              <li
                key={card.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 10,
                  background: "#f8fafc",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <span>
                  {card.emoji ? `${card.emoji} ` : ""}
                  {card.label}
                  {card.category ? ` (${card.category})` : ""}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => {
                      void handleMoveCard(index, -1);
                    }}
                    disabled={index === 0 || movingCardId === card.id}
                    style={{
                      padding: "6px 8px",
                      background: "#dbeafe",
                      borderRadius: 6,
                      border: "none",
                    }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => {
                      void handleMoveCard(index, 1);
                    }}
                    disabled={
                      index === safeCards.length - 1 || movingCardId === card.id
                    }
                    style={{
                      padding: "6px 8px",
                      background: "#dbeafe",
                      borderRadius: 6,
                      border: "none",
                    }}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => {
                      void handleRemoveCard(card.id);
                    }}
                    disabled={removingCardId === card.id}
                    style={{
                      padding: "6px 8px",
                      background: "#ef4444",
                      color: "white",
                      borderRadius: 6,
                      border: "none",
                    }}
                  >
                    {removingCardId === card.id ? "削除中..." : "✕"}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {safeCards.length === 0 ? (
            <p style={{ color: "#666" }}>
              このロケーションにはまだカードがありません。
            </p>
          ) : null}
        </section>
      ) : (
        <p style={{ color: "#666" }}>
          ロケーションを選ぶと、そのロケーションのカードがここに表示されます。
        </p>
      )}
    </div>
  );
}
