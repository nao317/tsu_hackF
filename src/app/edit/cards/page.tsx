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

const maxImageSizeBytes = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function validateImageFile(file: File): string | null {
  if (!allowedImageTypes.has(file.type)) {
    return "画像はJPEG・PNG・WebPのみ対応しています。";
  }

  if (file.size > maxImageSizeBytes) {
    return "画像サイズは5MB以下にしてください。";
  }

  return null;
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
  const [imageUpdatingCardId, setImageUpdatingCardId] = React.useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [newCardLabel, setNewCardLabel] = React.useState("");
  const [newCardEmoji, setNewCardEmoji] = React.useState("");
  const [newCardCategory, setNewCardCategory] = React.useState("");
  const [newCardImageFile, setNewCardImageFile] = React.useState<File | null>(
    null,
  );

  const newCardImagePreview = React.useMemo(() => {
    if (!newCardImageFile) {
      return null;
    }

    return URL.createObjectURL(newCardImageFile);
  }, [newCardImageFile]);

  React.useEffect(() => {
    return () => {
      if (newCardImagePreview) {
        URL.revokeObjectURL(newCardImagePreview);
      }
    };
  }, [newCardImagePreview]);

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
    const selectedImage = newCardImageFile;

    if (!selectedLocationId) {
      setErrorMessage("先にロケーションを選択してください。");
      return;
    }
    if (!trimmedLabel) {
      setErrorMessage("カード名を入力してください。");
      return;
    }

    if (selectedImage) {
      const validationError = validateImageFile(selectedImage);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
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

        if (selectedImage) {
          formData.append("file", selectedImage);
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
      setNewCardImageFile(null);
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

  const createReplacementCard = React.useCallback(
    async (card: Card, file: File | null) => {
      return callWithAuthRetry((accessToken) => {
        const formData = new FormData();
        formData.append("label", card.label);

        const emoji = card.emoji?.trim() ?? "";
        if (emoji) {
          formData.append("emoji", emoji);
        }

        const category = card.category?.trim() ?? "";
        if (category) {
          formData.append("category", category);
        }

        if (file) {
          formData.append("file", file);
        }

        return createUserCardAction(formData, accessToken);
      });
    },
    [],
  );

  const replaceCardForLocation = React.useCallback(
    async (
      locationId: string,
      sourceCardId: string,
      replacementCardId: string,
      sortOrder: number,
    ) => {
      await callWithAuthRetry((accessToken) =>
        addCardToUserLocationAction(
          locationId,
          {
            card_id: replacementCardId,
            sort_order: sortOrder,
          },
          accessToken,
        ),
      );

      try {
        await callWithAuthRetry((accessToken) =>
          removeCardFromUserLocationAction(
            locationId,
            sourceCardId,
            accessToken,
          ),
        );
      } catch (error) {
        await callWithAuthRetry((accessToken) =>
          removeCardFromUserLocationAction(
            locationId,
            replacementCardId,
            accessToken,
          ),
        ).catch(() => undefined);
        throw error;
      }
    },
    [],
  );

  const handleReplaceCardImage = async (
    card: Card,
    sortOrder: number,
    file: File,
  ) => {
    if (!selectedLocationId) {
      setErrorMessage("先にロケーションを選択してください。");
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);
    setImageUpdatingCardId(card.id);

    try {
      const replacement = await createReplacementCard(card, file);
      await replaceCardForLocation(
        selectedLocationId,
        card.id,
        replacement.id,
        sortOrder,
      );
      await loadCards(selectedLocationId);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      if (shouldRedirectLogin(message)) {
        router.replace("/login");
      }
    } finally {
      setImageUpdatingCardId(null);
    }
  };

  const handleRemoveCardImage = async (card: Card, sortOrder: number) => {
    if (!selectedLocationId) {
      setErrorMessage("先にロケーションを選択してください。");
      return;
    }

    if (!card.image_url) {
      setErrorMessage("このカードには画像が設定されていません。");
      return;
    }

    setErrorMessage(null);
    setImageUpdatingCardId(card.id);

    try {
      const replacement = await createReplacementCard(card, null);
      await replaceCardForLocation(
        selectedLocationId,
        card.id,
        replacement.id,
        sortOrder,
      );
      await loadCards(selectedLocationId);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      if (shouldRedirectLogin(message)) {
        router.replace("/login");
      }
    } finally {
      setImageUpdatingCardId(null);
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isSubmitting}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                event.currentTarget.value = "";

                if (!file) {
                  return;
                }

                const validationError = validateImageFile(file);
                if (validationError) {
                  setErrorMessage(validationError);
                  return;
                }

                setErrorMessage(null);
                setNewCardImageFile(file);
              }}
            />
            {newCardImageFile ? (
              <button
                onClick={() => {
                  setNewCardImageFile(null);
                }}
                disabled={isSubmitting}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                }}
              >
                画像を外す
              </button>
            ) : null}
            {newCardImagePreview ? (
              <img
                src={newCardImagePreview}
                alt="選択中の画像"
                style={{
                  width: 56,
                  height: 56,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                }}
              />
            ) : (
              <span style={{ color: "#64748b", fontSize: 13 }}>
                画像を指定しない場合はテキストカードとして保存されます。
              </span>
            )}
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
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={`${card.label} の画像`}
                      style={{
                        width: 44,
                        height: 44,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        border: "1px dashed #cbd5e1",
                        color: "#94a3b8",
                        fontSize: 11,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#fff",
                        padding: 4,
                        textAlign: "center",
                      }}
                    >
                      画像なし
                    </div>
                  )}
                  <span>
                    {card.emoji ? `${card.emoji} ` : ""}
                    {card.label}
                    {card.category ? ` (${card.category})` : ""}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <label
                    style={{
                      padding: "6px 8px",
                      background: "#fef3c7",
                      borderRadius: 6,
                      border: "1px solid #fcd34d",
                      cursor:
                        isSubmitting || imageUpdatingCardId === card.id
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        isSubmitting || imageUpdatingCardId === card.id
                          ? 0.6
                          : 1,
                    }}
                  >
                    {imageUpdatingCardId === card.id
                      ? "画像更新中..."
                      : "画像変更"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      disabled={isSubmitting || imageUpdatingCardId === card.id}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        event.currentTarget.value = "";

                        if (!file) {
                          return;
                        }

                        void handleReplaceCardImage(card, index, file);
                      }}
                    />
                  </label>
                  {card.image_url ? (
                    <button
                      onClick={() => {
                        void handleRemoveCardImage(card, index);
                      }}
                      disabled={isSubmitting || imageUpdatingCardId === card.id}
                      style={{
                        padding: "6px 8px",
                        background: "#fee2e2",
                        borderRadius: 6,
                        border: "1px solid #fca5a5",
                      }}
                    >
                      画像削除
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      void handleMoveCard(index, -1);
                    }}
                    disabled={
                      index === 0 ||
                      movingCardId === card.id ||
                      imageUpdatingCardId === card.id
                    }
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
                      index === safeCards.length - 1 ||
                      movingCardId === card.id ||
                      imageUpdatingCardId === card.id
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
                    disabled={
                      removingCardId === card.id ||
                      imageUpdatingCardId === card.id
                    }
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
