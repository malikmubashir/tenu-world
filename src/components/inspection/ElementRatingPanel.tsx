"use client";

/**
 * ElementRatingPanel — Per-room element rating UI.
 *
 * Shows all elements for the current room type (10 standard + extras
 * for kitchen/bathroom). Each element has a TB/B/M/MV selector and
 * an optional comment field. Ratings auto-save on change.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getElementsForRoomType,
  RATINGS,
  type ElementDef,
  type Rating,
} from "@/lib/inspection/elements";

interface ElementRatingData {
  elementKey: string;
  rating: Rating;
  comment: string;
}

interface ElementRatingPanelProps {
  roomId: string;
  roomType: string;
  onRatingsChange?: (ratings: ElementRatingData[]) => void;
}

export default function ElementRatingPanel({
  roomId,
  roomType,
  onRatingsChange,
}: ElementRatingPanelProps) {
  const elements = getElementsForRoomType(roomType);

  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expandedElement, setExpandedElement] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  /* Load existing ratings from server */
  const loadRatings = useCallback(async () => {
    try {
      const res = await fetch(`/api/inspection/ratings?roomId=${roomId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.ratings) {
        const r: Record<string, Rating> = {};
        const c: Record<string, string> = {};
        for (const item of data.ratings) {
          r[item.element_key] = item.rating as Rating;
          if (item.comment) c[item.element_key] = item.comment;
        }
        setRatings(r);
        setComments(c);
      }
    } catch {
      /* silent — ratings will default to empty */
    } finally {
      setLoaded(true);
    }
  }, [roomId]);

  useEffect(() => {
    setLoaded(false);
    loadRatings();
  }, [roomId, loadRatings]);

  /* Save a single element rating */
  async function saveRating(elementKey: string, rating: Rating, comment: string) {
    setSaving(true);
    try {
      await fetch("/api/inspection/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, elementKey, rating, comment: comment || null }),
      });
    } catch {
      /* silent — will retry on next change */
    } finally {
      setSaving(false);
    }
  }

  /* Handle rating change */
  function handleRating(elementKey: string, rating: Rating) {
    setRatings((prev) => ({ ...prev, [elementKey]: rating }));
    const comment = comments[elementKey] || "";
    saveRating(elementKey, rating, comment);
    notifyChange(elementKey, rating, comment);
  }

  /* Handle comment change (save on blur) */
  function handleCommentBlur(elementKey: string) {
    const rating = ratings[elementKey] || "B";
    const comment = comments[elementKey] || "";
    saveRating(elementKey, rating, comment);
    notifyChange(elementKey, rating, comment);
  }

  function notifyChange(elementKey: string, rating: Rating, comment: string) {
    if (!onRatingsChange) return;
    const allRatings = elements.map((el) => ({
      elementKey: el.key,
      rating: el.key === elementKey ? rating : (ratings[el.key] || "B"),
      comment: el.key === elementKey ? comment : (comments[el.key] || ""),
    }));
    onRatingsChange(allRatings);
  }

  /* Progress indicator */
  const ratedCount = elements.filter((el) => ratings[el.key]).length;
  const totalCount = elements.length;

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-tenu-slate/40">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-tenu-slate/50">
        <span>Évaluation des éléments</span>
        <span>
          {ratedCount}/{totalCount}
          {saving && " · Enregistrement..."}
        </span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-tenu-cream-dark">
        <div
          className="h-full rounded-full bg-tenu-forest transition-all duration-300"
          style={{ width: `${totalCount > 0 ? (ratedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Element list */}
      {elements.map((el: ElementDef) => {
        const currentRating = ratings[el.key];
        const isExpanded = expandedElement === el.key;

        return (
          <div
            key={el.key}
            className="rounded-lg border border-tenu-cream-dark bg-white"
          >
            {/* Element header with rating buttons */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="flex-1 text-sm text-tenu-slate">{el.labelFr}</span>

              {/* Rating chips */}
              <div className="flex gap-1">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => handleRating(el.key, r.value)}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      currentRating === r.value
                        ? r.value === "TB"
                          ? "bg-tenu-success/10 text-tenu-success ring-1 ring-tenu-success/30"
                          : r.value === "B"
                            ? "bg-tenu-forest/10 text-tenu-forest ring-1 ring-tenu-forest/30"
                            : r.value === "M"
                              ? "bg-tenu-warning/10 text-tenu-warning ring-1 ring-tenu-warning/30"
                              : "bg-tenu-danger/10 text-tenu-danger ring-1 ring-tenu-danger/30"
                        : "text-tenu-slate/30 hover:text-tenu-slate/60"
                    }`}
                    title={r.labelFr}
                  >
                    {r.value}
                  </button>
                ))}
              </div>

              {/* Expand for comment */}
              <button
                type="button"
                onClick={() => setExpandedElement(isExpanded ? null : el.key)}
                className={`ml-1 text-xs ${
                  comments[el.key]
                    ? "text-tenu-forest"
                    : "text-tenu-slate/30 hover:text-tenu-slate/60"
                }`}
                title="Ajouter un commentaire"
              >
                {comments[el.key] ? "✎" : "+"}
              </button>
            </div>

            {/* Comment field (collapsed by default) */}
            {isExpanded && (
              <div className="border-t border-tenu-cream-dark px-3 py-2">
                <textarea
                  value={comments[el.key] || ""}
                  onChange={(e) =>
                    setComments((prev) => ({ ...prev, [el.key]: e.target.value }))
                  }
                  onBlur={() => handleCommentBlur(el.key)}
                  placeholder="Remarque (ex: rayure sur le mur côté fenêtre)"
                  rows={2}
                  className="w-full resize-none rounded border border-tenu-cream-dark px-2 py-1.5 text-xs outline-none focus:border-tenu-forest"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
