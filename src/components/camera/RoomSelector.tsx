"use client";

/**
 * RoomSelector — horizontal chip row to switch the active room during
 * photo capture. Momentum scroll (hig-scroll-x), 44px touch targets,
 * press feedback, aria-pressed for screen readers. The trailing
 * "+ Add room" chip is a placeholder until custom rooms ship.
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
            "hig-press flex min-h-11 shrink-0 flex-col items-center justify-center rounded-lg border px-4 py-2 text-xs font-medium",
            activeRoomId === room.id
              ? "border-tenu-forest bg-tenu-forest text-white"
              : "border-tenu-cream-dark bg-white text-tenu-slate hover:border-tenu-forest/40",
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
        className="hig-press flex min-h-11 shrink-0 items-center rounded-lg border border-dashed border-tenu-cream-dark px-4 py-2 text-xs text-tenu-slate/60 hover:border-tenu-forest/40 hover:text-tenu-forest"
      >
        + Add room
      </button>
    </div>
  );
}
