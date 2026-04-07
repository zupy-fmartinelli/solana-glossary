import { motion } from "framer-motion";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import {
  type Term,
  categoryLabels,
  type Category,
} from "@/data/glossaryAdapter";

interface RelatedTerm {
  layerId: string;
  term: Term;
}

interface Props {
  term: Term;
  layerId: string;
  relatedTerms: RelatedTerm[];
  onBack: () => void;
  onHome: () => void;
  onTermClick: (layerId: string, termId: string) => void;
}

const depthLabels: Record<string, string> = {
  surface: "Surface",
  shallow: "Shallow",
  deep: "Deep",
  abyss: "Abyss",
  bottom: "Bottom",
};

const TermView = ({
  term,
  layerId,
  relatedTerms,
  onBack,
  onHome,
  onTermClick,
}: Props) => {
  const termPositions = useMemo(() => {
    const count = Math.min(relatedTerms.length, 8);
    return relatedTerms.slice(0, 8).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const radiusX = 36;
      const radiusY = 34;
      return {
        left: 50 + Math.cos(angle) * radiusX,
        top: 50 + Math.sin(angle) * radiusY,
        duration: 4 + Math.random() * 3,
        delay: Math.random() * 2,
      };
    });
  }, [relatedTerms]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Blur backdrop - click to go home */}
      <div
        className="absolute inset-0"
        onClick={onHome}
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "rgba(0, 0, 0, 0.5)",
        }}
      />

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute z-[60] flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 text-foreground/80 hover:text-secondary border border-border/40 hover:border-secondary/40"
        style={{
          top: "64px",
          left: "16px",
          background: "rgba(10, 22, 40, 0.6)",
          backdropFilter: "blur(8px)",
        }}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* SVG connection lines from center to related terms */}
      <svg className="absolute inset-0 w-full h-full z-[55] pointer-events-none">
        {relatedTerms.slice(0, 8).map((r, i) => (
          <motion.line
            key={`line-${r.term.id}`}
            x1="50%"
            y1="50%"
            x2={`${termPositions[i].left}%`}
            y2={`${termPositions[i].top}%`}
            stroke="rgba(20, 241, 149, 0.2)"
            strokeWidth="1"
            strokeDasharray="4 4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          />
        ))}
      </svg>

      {/* Main term card */}
      <motion.div
        className="relative z-[60] text-center max-w-md px-8 py-8 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(10, 22, 40, 0.85)",
          border: "2px solid rgba(20, 241, 149, 0.6)",
          boxShadow:
            "0 0 40px rgba(20, 241, 149, 0.3), 0 0 80px rgba(20, 241, 149, 0.1), inset 0 0 30px rgba(20, 241, 149, 0.05)",
          backdropFilter: "blur(20px)",
        }}
        initial={{ y: 20, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h1 className="text-3xl md:text-5xl font-bold text-secondary mb-2">
          {term.name}
        </h1>

        {/* Category badge */}
        {term.category && (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full border border-secondary/30 text-secondary/70 bg-secondary/5 mb-3">
            {categoryLabels[term.category as Category]}
          </span>
        )}

        {/* Aliases */}
        {term.aliases && term.aliases.length > 0 && (
          <p className="text-xs text-foreground/40 mb-3">
            aka {term.aliases.join(", ")}
          </p>
        )}

        <p className="text-foreground/70 text-sm md:text-base leading-relaxed">
          {term.definition}
        </p>
      </motion.div>

      {/* Related terms positioned around center - desktop */}
      {relatedTerms.slice(0, 8).map((r, i) => (
        <motion.div
          key={r.term.id}
          className="absolute cursor-pointer hidden md:block z-[58]"
          style={{
            left: `${termPositions[i].left}%`,
            top: `${termPositions[i].top}%`,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          onClick={() => onTermClick(r.layerId, r.term.id)}
        >
          <div
            className="px-4 py-2 rounded-full transition-all text-xs font-medium text-foreground/70 whitespace-nowrap hover:text-secondary hover:bg-secondary/20"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(20, 241, 149, 0.25)",
              boxShadow: "0 0 10px rgba(20, 241, 149, 0.1)",
              backdropFilter: "blur(6px)",
              animation: `float-term ${termPositions[i].duration}s ease-in-out infinite`,
              animationDelay: `${termPositions[i].delay}s`,
            }}
          >
            {r.term.name}
            {r.layerId !== layerId && (
              <span className="text-[9px] text-foreground/30 ml-1">
                {depthLabels[r.layerId] ?? r.layerId}
              </span>
            )}
          </div>
        </motion.div>
      ))}

      {/* Mobile related terms */}
      <div className="md:hidden absolute bottom-12 left-0 right-0 px-6 z-[58]">
        <div className="flex flex-wrap justify-center gap-2">
          {relatedTerms.slice(0, 8).map((r, i) => (
            <motion.div
              key={r.term.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              onClick={() => onTermClick(r.layerId, r.term.id)}
              className="px-4 py-2 rounded-full cursor-pointer text-xs text-foreground/70 hover:text-secondary hover:bg-secondary/20"
              style={{
                border: "1px solid rgba(20, 241, 149, 0.2)",
                boxShadow: "0 0 10px rgba(20, 241, 149, 0.1)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {r.term.name}
              {r.layerId !== layerId && (
                <span className="text-[9px] text-foreground/30 ml-1">
                  {depthLabels[r.layerId] ?? r.layerId}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TermView;
