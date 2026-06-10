"use client";

/**
 * RoomSelector — horizontal row of hairline-framed rectangles to
 * switch the active room during photo capture (Éditorial v2, #T150:
 * blueprint feel — 1px frames, 0px radius, selected cell inverts to
 * black). Momentum scroll (hig-scroll-x), 44px touch targets, press
 * feedback, aria-pressed for screen readers. The trailing "+ Add
 * room" cell is a placeholder until custom rooms ship.
 */
import { clsx } from "clsx";

export type RoomType = "kitchen" | "bathroom" | "bedroom" | "living" | "hallway" | "balcony" | "other";

interface RoomSelectorProps {
  rooms: { id: string; type: RoomType; label: string; photoCount: number }[];
  activeRoomId: string | null;
  onSelect: (roomId: string) => void;
  onAdd: () => void;
  labels: Record<string, string>;
}

export default function RoomSelector({ rooms, activeRoomId, onSelect, onAdd, labels }: RoomSelectorProps) {
  return (
    <div className="hig-scroll-x flex gap-2 pb-2">
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onSelect(room.id)}
          aria-pressed={activeRoomId === room.id}
          className={clsx(
            "hig-press flex min-h-11 shrink-0 flex-col items-center justify-center rounded-none border px-4 py-2 text-xs font-medium",
            activeRoomId === room.id
              ? "border-tenu-ink bg-tenu-band-inverted text-tenu-canvas"
              : "border-tenu-hairline bg-tenu-canvas text-tenu-ink hover:border-tenu-ink",
          )}
        >
          <span>{labels[room.type] ?? room.type}</span>
          <span className="mt-0.5 text-[10px] opacity-70">
            {room.photoCount} photo{room.photoCount !== 1 ? "s" : ""}
          </span>
        </button>
      ))}
      <button
        onClick={onAdd}
        className="hig-press flex min-h-11 shrink-0 items-center rounded-none border border-dashed border-tenu-hairline px-4 py-2 text-xs text-tenu-ink-muted hover:border-tenu-ink hover:text-tenu-ink"
      >
        + Add room
      </button>
    </div>
  );
}
