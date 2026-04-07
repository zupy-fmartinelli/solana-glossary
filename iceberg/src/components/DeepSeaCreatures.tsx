import { useMemo } from "react";

const DeepSeaCreatures = () => {
  const creatures = useMemo(
    () => [
      // Lanternfish
      {
        type: "lanternfish",
        top: "85%",
        duration: "16s",
        delay: "0s",
        size: 28,
        dir: "right",
        opacity: 0.25,
      },
      {
        type: "lanternfish",
        top: "92%",
        duration: "20s",
        delay: "4s",
        size: 22,
        dir: "left",
        opacity: 0.2,
      },
      {
        type: "lanternfish",
        top: "88%",
        duration: "14s",
        delay: "8s",
        size: 18,
        dir: "right",
        opacity: 0.18,
      },
      // Giant squids
      {
        type: "squid",
        top: "90%",
        duration: "25s",
        delay: "2s",
        size: 50,
        dir: "left",
        opacity: 0.2,
      },
      {
        type: "squid",
        top: "95%",
        duration: "30s",
        delay: "10s",
        size: 40,
        dir: "right",
        opacity: 0.15,
      },
    ],
    [],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {creatures.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: c.top,
            animation: `${c.dir === "right" ? "swim-right" : "swim-left"} ${c.duration} linear infinite`,
            animationDelay: c.delay,
            opacity: c.opacity,
          }}
        >
          {c.type === "lanternfish" ? (
            <svg
              width={c.size}
              height={c.size * 0.6}
              viewBox="0 0 40 24"
              fill="none"
            >
              {/* Body */}
              <path
                d="M2 12 Q10 2 26 6 Q36 9 38 12 Q36 15 26 18 Q10 22 2 12Z"
                fill="hsl(200, 40%, 25%)"
              />
              {/* Bioluminescent spots */}
              <circle cx="10" cy="10" r="1.5" fill="rgba(80, 200, 255, 0.9)">
                <animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="16" cy="13" r="1.2" fill="rgba(80, 200, 255, 0.8)">
                <animate
                  attributeName="opacity"
                  values="0.3;0.9;0.3"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="22" cy="11" r="1" fill="rgba(80, 200, 255, 0.7)">
                <animate
                  attributeName="opacity"
                  values="0.5;1;0.5"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Eye */}
              <circle cx="30" cy="12" r="2" fill="rgba(150, 255, 255, 0.9)" />
              {/* Lantern (light organ) */}
              <circle cx="6" cy="6" r="2.5" fill="rgba(80, 220, 255, 0.6)">
                <animate
                  attributeName="r"
                  values="2;3;2"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.4;0.8;0.4"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <line
                x1="8"
                y1="7"
                x2="6"
                y2="6"
                stroke="hsl(200, 40%, 35%)"
                strokeWidth="0.5"
              />
            </svg>
          ) : (
            <svg
              width={c.size}
              height={c.size * 1.2}
              viewBox="0 0 50 60"
              fill="none"
            >
              {/* Mantle */}
              <ellipse
                cx="25"
                cy="18"
                rx="12"
                ry="16"
                fill="rgba(180, 50, 255, 0.4)"
              >
                <animate
                  attributeName="rx"
                  values="12;13;12"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </ellipse>
              {/* Bioluminescent glow */}
              <ellipse
                cx="25"
                cy="18"
                rx="8"
                ry="12"
                fill="rgba(200, 100, 255, 0.15)"
              >
                <animate
                  attributeName="opacity"
                  values="0.1;0.3;0.1"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </ellipse>
              {/* Eyes */}
              <circle cx="20" cy="15" r="3" fill="rgba(100, 255, 200, 0.7)">
                <animate
                  attributeName="opacity"
                  values="0.5;1;0.5"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="30" cy="15" r="3" fill="rgba(100, 255, 200, 0.7)">
                <animate
                  attributeName="opacity"
                  values="0.5;1;0.5"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Tentacles */}
              {[0, 1, 2, 3, 4, 5, 6, 7].map((t) => (
                <path
                  key={t}
                  d={`M${18 + t * 2} 34 Q${16 + t * 3} ${45 + (t % 3) * 3} ${14 + t * 3} 58`}
                  stroke="rgba(180, 80, 255, 0.35)"
                  strokeWidth="1.2"
                  fill="none"
                >
                  <animate
                    attributeName="d"
                    values={`M${18 + t * 2} 34 Q${16 + t * 3} ${45 + (t % 3) * 3} ${14 + t * 3} 58;M${18 + t * 2} 34 Q${18 + t * 3} ${47 + (t % 3) * 3} ${16 + t * 3} 58;M${18 + t * 2} 34 Q${16 + t * 3} ${45 + (t % 3) * 3} ${14 + t * 3} 58`}
                    dur={`${3 + t * 0.3}s`}
                    repeatCount="indefinite"
                  />
                </path>
              ))}
              {/* Fluorescent spots on tentacles */}
              {[0, 2, 4, 6].map((t) => (
                <circle
                  key={`glow-${t}`}
                  cx={17 + t * 3}
                  cy={48 + (t % 3) * 2}
                  r="1.2"
                  fill="rgba(150, 100, 255, 0.6)"
                >
                  <animate
                    attributeName="opacity"
                    values="0.2;0.7;0.2"
                    dur={`${2 + t * 0.5}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};

export default DeepSeaCreatures;
