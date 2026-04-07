const Sailboat = () => (
  <div
    className="absolute z-20"
    style={{
      bottom: "0",
      left: "20%",
      animation: "rock-boat 4s ease-in-out infinite",
      transformOrigin: "bottom center",
    }}
  >
    <svg width="60" height="50" viewBox="0 0 60 50" fill="none">
      {/* Sail */}
      <polygon points="30,5 30,35 10,35" fill="rgba(255,255,255,0.85)" />
      <polygon points="30,10 30,35 45,35" fill="rgba(255,255,255,0.6)" />
      {/* Mast */}
      <line x1="30" y1="5" x2="30" y2="40" stroke="white" strokeWidth="1.5" />
      {/* Hull */}
      <path
        d="M5 40 Q10 50 30 50 Q50 50 55 40 Z"
        fill="hsl(220, 40%, 25%)"
        stroke="hsl(210, 25%, 65%)"
        strokeWidth="1"
      />
    </svg>
  </div>
);

export default Sailboat;
