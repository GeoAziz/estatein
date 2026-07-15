const COLORS = ["#703bf7", "#a78bfa", "#34d399", "#fbbf24", "#f472b6"];

export default function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1 + Math.random() * 0.6,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 6,
  }));

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
