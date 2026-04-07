const Aurora = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity: 0.5 }}
    >
      {/* Main aurora bands */}
      {[
        {
          color1: "rgba(180, 0, 255, 0.5)",
          color2: "rgba(0, 230, 255, 0.3)",
          duration: "12s",
          delay: "0s",
          top: "0%",
          height: "180px",
          skew: -3,
        },
        {
          color1: "rgba(0, 210, 230, 0.45)",
          color2: "rgba(120, 0, 255, 0.25)",
          duration: "16s",
          delay: "1.5s",
          top: "4%",
          height: "150px",
          skew: 2,
        },
        {
          color1: "rgba(200, 50, 255, 0.5)",
          color2: "rgba(0, 255, 220, 0.3)",
          duration: "14s",
          delay: "0.8s",
          top: "8%",
          height: "160px",
          skew: -1,
        },
        {
          color1: "rgba(0, 240, 255, 0.4)",
          color2: "rgba(160, 30, 255, 0.35)",
          duration: "18s",
          delay: "2.5s",
          top: "2%",
          height: "200px",
          skew: 1.5,
        },
        {
          color1: "rgba(140, 0, 220, 0.45)",
          color2: "rgba(0, 200, 200, 0.3)",
          duration: "10s",
          delay: "0.3s",
          top: "12%",
          height: "140px",
          skew: -2,
        },
        {
          color1: "rgba(0, 220, 240, 0.35)",
          color2: "rgba(180, 60, 255, 0.4)",
          duration: "20s",
          delay: "3s",
          top: "6%",
          height: "170px",
          skew: 2.5,
        },
        {
          color1: "rgba(220, 80, 255, 0.3)",
          color2: "rgba(0, 255, 200, 0.25)",
          duration: "15s",
          delay: "4s",
          top: "15%",
          height: "120px",
          skew: -1.5,
        },
        {
          color1: "rgba(0, 200, 255, 0.4)",
          color2: "rgba(100, 0, 200, 0.3)",
          duration: "22s",
          delay: "1s",
          top: "10%",
          height: "190px",
          skew: 0.5,
        },
      ].map((wave, i) => (
        <div
          key={i}
          className="absolute w-[300%]"
          style={{
            top: wave.top,
            height: wave.height,
            left: "-100%",
            background: `linear-gradient(90deg, transparent 5%, ${wave.color1} 25%, ${wave.color2} 45%, ${wave.color1} 55%, ${wave.color2} 75%, transparent 95%)`,
            filter: "blur(50px)",
            transform: `skewY(${wave.skew}deg)`,
            animation: `aurora-drift ${wave.duration} ease-in-out infinite, aurora-pulse ${parseFloat(wave.duration) * 0.7}s ease-in-out infinite`,
            animationDelay: `${wave.delay}, ${parseFloat(wave.delay) + 1}s`,
          }}
        />
      ))}

      {/* Central radial glow */}
      <div
        className="absolute w-[140%] left-[-20%]"
        style={{
          top: "0%",
          height: "250px",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0, 230, 255, 0.25) 0%, rgba(180, 50, 255, 0.2) 30%, rgba(0, 200, 220, 0.1) 50%, transparent 70%)",
          filter: "blur(40px)",
          animation: "aurora-drift 15s ease-in-out infinite",
        }}
      />

      {/* Vertical curtain streaks */}
      {[
        {
          left: "20%",
          color: "rgba(0, 230, 255, 0.15)",
          width: "80px",
          delay: "0s",
        },
        {
          left: "35%",
          color: "rgba(180, 60, 255, 0.12)",
          width: "100px",
          delay: "2s",
        },
        {
          left: "55%",
          color: "rgba(0, 210, 230, 0.15)",
          width: "70px",
          delay: "1s",
        },
        {
          left: "70%",
          color: "rgba(200, 80, 255, 0.12)",
          width: "90px",
          delay: "3s",
        },
        {
          left: "85%",
          color: "rgba(0, 240, 255, 0.1)",
          width: "60px",
          delay: "1.5s",
        },
      ].map((streak, i) => (
        <div
          key={`streak-${i}`}
          className="absolute"
          style={{
            left: streak.left,
            top: "0%",
            width: streak.width,
            height: "220px",
            background: `linear-gradient(180deg, ${streak.color} 0%, transparent 100%)`,
            filter: "blur(20px)",
            animation: `aurora-curtain 8s ease-in-out infinite`,
            animationDelay: streak.delay,
          }}
        />
      ))}
    </div>
  );
};

export default Aurora;
