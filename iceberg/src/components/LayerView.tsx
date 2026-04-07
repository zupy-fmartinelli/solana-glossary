import { motion } from "framer-motion";
import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, Search } from "lucide-react";
import {
  type IcebergLayer,
  type Category,
  categoryLabels,
} from "@/data/glossaryAdapter";

interface Props {
  layer: IcebergLayer;
  layerIndex: number;
  selectedCategories: Set<Category>;
  onBack: () => void;
  onTermClick: (termId: string) => void;
}

const TermCard = ({
  term,
  isClicked,
  onClick,
}: {
  term: { id: string; name: string; category?: Category };
  isClicked: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`term-card cursor-pointer rounded-xl flex flex-col items-center justify-center h-[72px] px-3${isClicked ? " is-clicked" : ""}`}
  >
    <span className="term-card-name text-sm font-medium text-foreground/90 block truncate max-w-full">
      {term.name}
    </span>
    {term.category && (
      <span className="text-[10px] text-foreground/30 mt-0.5 block">
        {categoryLabels[term.category]}
      </span>
    )}
  </div>
);

const LayerView = ({
  layer,
  layerIndex,
  selectedCategories,
  onBack,
  onTermClick,
}: Props) => {
  const [clickedTerm, setClickedTerm] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState("");

  const filteredTerms = useMemo(() => {
    let terms = layer.terms;

    if (selectedCategories.size > 0) {
      terms = terms.filter(
        (t) => t.category && selectedCategories.has(t.category),
      );
    }

    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      terms = terms.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          t.aliases?.some((a) => a.toLowerCase().includes(q)),
      );
    }

    return terms;
  }, [layer.terms, selectedCategories, localSearch]);

  const handleTermClick = useCallback(
    (termId: string) => {
      setClickedTerm(termId);
      setTimeout(() => onTermClick(termId), 200);
    },
    [onTermClick],
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Blur backdrop - click to go back */}
      <div
        className="absolute inset-0"
        onClick={onBack}
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "rgba(0, 0, 0, 0.5)",
        }}
      />

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute z-[70] flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-200 text-foreground/80 hover:text-secondary border border-border/40 hover:border-secondary/40"
        style={{
          top: "64px",
          left: "16px",
          background: "rgba(10, 22, 40, 0.6)",
          backdropFilter: "blur(8px)",
        }}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Layer title */}
      <motion.div
        className="relative z-[60] text-center pt-20 pb-4 px-4"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h2
          className="text-3xl md:text-5xl font-bold tracking-[0.3em]"
          style={{
            color: layer.color,
            textShadow: `0 0 30px rgba(20,241,149,0.4), 0 0 60px rgba(20,241,149,0.2), 0 0 40px ${layer.color}60, 0 0 80px ${layer.color}30, 0 4px 30px rgba(0,0,0,0.9)`,
          }}
        >
          {layer.name}
        </h2>
        <p className="text-sm text-foreground/40 mt-1">
          {filteredTerms.length} of {layer.terms.length} terms
        </p>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {layer.categories.map((cat) => {
            const isActive =
              selectedCategories.size === 0 || selectedCategories.has(cat);
            return (
              <span
                key={cat}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  isActive
                    ? "border-secondary/40 text-secondary/80 bg-secondary/10"
                    : "border-foreground/10 text-foreground/30"
                }`}
              >
                {categoryLabels[cat]}
              </span>
            );
          })}
        </div>

        {/* Local search */}
        <div className="flex justify-center mt-3">
          <div
            className="flex items-center gap-2 rounded-lg border border-secondary/20 bg-background/40 backdrop-blur-xl px-3"
            style={{ height: "36px", maxWidth: "300px", width: "100%" }}
          >
            <Search className="w-3.5 h-3.5 text-secondary/50 shrink-0" />
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter terms..."
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Scrollable term grid — native overflow for perf */}
      <div
        className="relative z-[60] flex-1 min-h-0 px-4 pb-6 overflow-y-auto will-change-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-5xl mx-auto pb-4">
          {filteredTerms.map((term) => (
            <TermCard
              key={term.id}
              term={term}
              isClicked={clickedTerm === term.id}
              onClick={() => handleTermClick(term.id)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default LayerView;
