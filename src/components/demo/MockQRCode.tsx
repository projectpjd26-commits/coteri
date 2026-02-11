"use client";

/**
 * Decorative mock QR code for membership view negative space.
 * Not scannable; suggests “scan at door” without real data.
 */
type Props = { venueName?: string; /** Pixel width of the QR grid (default 96). */ size?: number };

/**
 * Decorative mock QR for the selected venue. One per venue — not scannable.
 */
export function MockQRCode({ venueName, size: width = 96 }: Props) {
  const size = 12;
  const cells = Array.from({ length: size * size }, (_, i) => {
    const row = Math.floor(i / size);
    const col = i % size;
    const isEdge = row < 2 || row >= size - 2 || col < 2 || col >= size - 2;
    const isCorner = (row < 3 && col < 3) || (row < 3 && col >= size - 3) || (row >= size - 3 && col < 3);
    const fill = isCorner || (isEdge && (row + col) % 2 === 0) || (!isEdge && (row * 7 + col * 11) % 5 !== 0);
    return { row, col, fill };
  });

  return (
    <div
      className="rounded-xl border border-white/20 p-3"
      style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
      aria-hidden
    >
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, width }}>
        {cells.map(({ row, col, fill }) => (
          <div
            key={`${row}-${col}`}
            className="aspect-square rounded-sm"
            style={{ backgroundColor: fill ? "rgba(255,255,255,0.9)" : "transparent" }}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-white/60">Scan at door</p>
      {venueName && <p className="mt-1 text-center text-[10px] text-white/70 truncate max-w-[120px] mx-auto">{venueName}</p>}
    </div>
  );
}
