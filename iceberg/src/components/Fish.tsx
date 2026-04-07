import { useMemo } from "react";

const Fish = () => {
  const fishes = useMemo(
    () => [
      {
        top: "15%",
        duration: "12s",
        delay: "0s",
        size: 20,
        dir: "right",
        opacity: 0.3,
      },
      {
        top: "35%",
        duration: "18s",
        delay: "3s",
        size: 16,
        dir: "left",
        opacity: 0.2,
      },
      {
        top: "55%",
        duration: "10s",
        delay: "6s",
        size: 24,
        dir: "right",
        opacity: 0.25,
      },
      {
        top: "25%",
        duration: "15s",
        delay: "2s",
        size: 14,
        dir: "left",
        opacity: 0.15,
      },
      {
        top: "70%",
        duration: "20s",
        delay: "8s",
        size: 18,
        dir: "right",
        opacity: 0.2,
      },
      {
        top: "45%",
        duration: "14s",
        delay: "5s",
        size: 22,
        dir: "left",
        opacity: 0.18,
      },
      {
        top: "80%",
        duration: "16s",
        delay: "1s",
        size: 12,
        dir: "right",
        opacity: 0.12,
      },
    ],
    [],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {fishes.map((fish, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: fish.top,
            animation: `${fish.dir === "right" ? "swim-right" : "swim-left"} ${fish.duration} linear infinite`,
            animationDelay: fish.delay,
            opacity: fish.opacity,
          }}
        >
          <svg
            width={fish.size}
            height={fish.size * 0.6}
            viewBox="0 0 30 18"
            fill="none"
          >
            <path
              d="M0 9 Q8 0 20 4 Q28 7 30 9 Q28 11 20 14 Q8 18 0 9Z"
              fill="hsl(210, 25%, 65%)"
            />
            <circle cx="22" cy="9" r="1.5" fill="hsl(200, 30%, 90%)" />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default Fish;
