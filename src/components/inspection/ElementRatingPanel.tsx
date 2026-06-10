"use client";

/**
 * ElementRatingPanel — Per-room element rating UI.
 *
 * Shows all elements for the current room type (10 standard + extras
 * for kitchen/bathroom). Each element has a TB/B/M/MV selector and
 * an optional comment field. Ratings auto-save on change.
 *
 * Éditorial v2 (#T150): each element row is a hairline-framed cell
 * (0px radius). Rating chips are flat hairline cells; the selected
 * chip inverts to black. The progress rule is a 1px hairline track
 * with a black fill — no rounded pills, no tinted fills.
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

  // Skeleton rows mirror the rated-list layout so the panel does not
  // jump when real rows replace them. (Hairline-toned pulse — the
  // shimmer helper went invisible on the all-white editorial canvas.)
  if (!loaded) {
    return (
      <div className="space-y-2 py-1" aria-busy="true">
        <div className="h-4 w-40 animate-pulse bg-tenu-hairline motion-reduce:animate-none" />
        <div className="h-11 w-full animate-pulse bg-tenu-hairline motion-reduce:animate-none" />
        <div className="h-11 w-full animate-pulse bg-tenu-hairline motion-reduce:animate-none" />
        <div className="h-11 w-full animate-pulse bg-tenu-hairline motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Progress label */}
      <div className="flex items-center justify-between text-xs text-tenu-ink-muted">
        <span>Évaluation des éléments</span>
        <span>
          {ratedCount}/{totalCount}
          {saving && " · Enregistrement..."}
        </span>
      </div>
      {/* Progress rule — hairline track, black fill, 0px radius. */}
      <div className="mb-3 h-px w-full bg-tenu-hairline">
        <div
          className="h-px bg-tenu-ink transition-all duration-300"
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
            className="border border-tenu-hairline bg-tenu-canvas"
          >
            {/* Element header with rating buttons */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="flex-1 text-sm text-tenu-ink">{el.labelFr}</span>

              {/* Rating chips — flat hairline cells, selected inverts. */}
              <div className="flex gap-1">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => handleRating(el.key, r.value)}
                    aria-pressed={currentRating === r.value}
                    className={`hig-press min-h-9 min-w-9 rounded-none border px-2 py-1 text-xs font-medium ${
                      currentRating === r.value
                        ? "border-tenu-ink bg-tenu-band-inverted text-tenu-canvas"
                        : "border-tenu-hairline text-tenu-ink-muted hover:border-tenu-ink hover:text-tenu-ink"
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
                aria-expanded={isExpanded}
                aria-label="Ajouter un commentaire"
                className={`hig-press ms-1 flex min-h-9 min-w-9 items-center justify-center rounded-none text-xs transition-colors duration-150 ${
                  comments[el.key]
                    ? "text-tenu-ink"
                    : "text-tenu-ash hover:text-tenu-ink"
                }`}
                title="Ajouter un commentaire"
              >
                {comments[el.key] ? "✎" : "+"}
              </button>
            </div>

            {/* Comment field (collapsed by default) */}
            {isExpanded && (
              <div className="border-t border-tenu-hairline px-3 py-2">
                <textarea
                  value={comments[el.key] || ""}
                  onChange={(e) =>
                    setComments((prev) => ({ ...prev, [el.key]: e.target.value }))
                  }
                  onBlur={() => handleCommentBlur(el.key)}
                  placeholder="Remarque (ex: rayure sur le mur côté fenêtre)"
                  rows={2}
                  className="w-full resize-none rounded-[2px] border border-tenu-ink-muted px-2 py-1.5 text-xs text-tenu-ink placeholder:text-tenu-ash outline-none focus-visible:outline-none transition-colors duration-150 focus:border-tenu-ink"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
