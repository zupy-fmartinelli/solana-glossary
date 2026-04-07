import { useState, useMemo } from "react";
import { Search, Shuffle } from "lucide-react";
import {
  searchAllTerms,
  allTerms,
  categoryToDepth,
} from "@/data/glossaryAdapter";

interface Props {
  onTermClick: (layerId: string, termId: string) => void;
}

const SearchBar = ({ onTermClick }: Props) => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    return searchAllTerms(query).slice(0, 8);
  }, [query]);

  const handleRandom = () => {
    const pick = allTerms[Math.floor(Math.random() * allTerms.length)];
    if (pick?.category) {
      const layerId = categoryToDepth[pick.category];
      onTermClick(layerId, pick.id);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[60] flex items-center gap-2">
      {/* Random button */}
      <button
        onClick={handleRandom}
        className="flex items-center justify-center rounded-xl border border-secondary/20 bg-background/60 backdrop-blur-xl px-3 text-foreground/60 hover:text-secondary transition-colors"
        style={{ boxShadow: "0 0 15px rgba(20,241,149,0.1)", height: "42px" }}
        title="Random term"
      >
        <Shuffle className="w-4 h-4" />
      </button>

      {/* Search bar */}
      <div className="relative">
        <div
          className="flex items-center gap-2 rounded-xl border border-secondary/20 bg-background/60 backdrop-blur-xl px-3"
          style={{ boxShadow: "0 0 15px rgba(20,241,149,0.1)", height: "42px" }}
        >
          <Search className="w-4 h-4 text-secondary/60 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder="Search 1001 terms..."
            className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-40 md:w-52"
          />
        </div>

        {focused && results.length > 0 && (
          <div
            className="absolute top-full right-0 mt-2 w-72 rounded-xl border border-secondary/20 bg-background/90 backdrop-blur-xl p-2"
            style={{ boxShadow: "0 0 30px rgba(20,241,149,0.1)" }}
          >
            {results.map((r) => (
              <button
                key={`${r.layerId}-${r.term.id}`}
                onMouseDown={() => {
                  onTermClick(r.layerId, r.term.id);
                  setQuery("");
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground/80 hover:text-secondary hover:bg-secondary/10 transition-all"
              >
                {r.term.name}
                {r.matchedAlias && (
                  <span className="text-xs text-secondary/50 ml-1">
                    ({r.matchedAlias})
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-2">
                  ({r.layerId})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
