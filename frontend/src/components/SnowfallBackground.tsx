// Purely decorative, ambient particle background — subtle and slow, sits
// behind page content (pointer-events disabled so it never blocks clicks).
// Respects prefers-reduced-motion via the global rule in index.css.
const PARTICLE_COUNT = 22;

function seededParticles(count: number) {
  return Array.from({ length: count }).map((_, i) => {
    // Deterministic pseudo-random spread so particles don't reshuffle on re-render.
    const left = (i * 47) % 100;
    const size = 3 + ((i * 13) % 6);
    const duration = 14 + ((i * 7) % 12);
    const delay = -((i * 5) % duration);
    const drift = ((i % 2 === 0 ? 1 : -1) * (10 + (i % 20))).toFixed(0);
    return { id: i, left, size, duration, delay, drift };
  });
}

export default function SnowfallBackground() {
  const particles = seededParticles(PARTICLE_COUNT);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-5%] rounded-full bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.6)]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            // @ts-expect-error -- custom properties consumed by the keyframes below
            "--drift": `${p.drift}px`,
            animation: `snowfall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}