import { useMemo } from "react";

const Bubbles = () => {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 4 + 2,
        duration: `${Math.random() * 8 + 6}s`,
        delay: `${Math.random() * 10}s`,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute bottom-0 rounded-full"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            background: "rgba(20, 241, 149, 0.3)",
            animation: `bubble-rise ${b.duration} ease-out infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  );
};

export default Bubbles;
