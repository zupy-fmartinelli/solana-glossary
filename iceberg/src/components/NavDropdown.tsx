import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import {
  getIcebergLayers,
  categoryLabels,
  type Category,
} from "@/data/glossaryAdapter";

const icebergLayers = getIcebergLayers();

const allCategories: { id: Category; name: string }[] = (
  Object.entries(categoryLabels) as [Category, string][]
).map(([id, name]) => ({ id, name }));

interface Props {
  onLayerClick: (layerId: string) => void;
  onCategoryClick?: (category: string) => void;
  selectedCategories?: Set<Category>;
  onClearCategories?: () => void;
}

const DropdownSection = ({
  label,
  items,
  onSelect,
  multiSelect = false,
  selected,
}: {
  label: string;
  items: { id: string; name: string }[];
  onSelect: (id: string) => void;
  multiSelect?: boolean;
  selected?: Set<string>;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (id: string) => {
    onSelect(id);
    if (!multiSelect) setOpen(false);
  };

  const activeCount = selected?.size ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 text-sm font-medium text-foreground/80 hover:text-secondary transition-colors"
        style={{ height: "42px" }}
      >
        {label}
        {multiSelect && activeCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-52 rounded-xl border border-secondary/20 bg-background/90 backdrop-blur-xl p-2 z-[70] max-h-80 overflow-y-auto"
          style={{ boxShadow: "0 0 30px rgba(20,241,149,0.1)" }}
        >
          {items.map((item) => {
            const isSelected = selected?.has(item.id) ?? false;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  isSelected
                    ? "text-secondary bg-secondary/10"
                    : "text-foreground/80 hover:text-secondary hover:bg-secondary/10"
                }`}
              >
                {multiSelect && (
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "border-secondary bg-secondary/20"
                        : "border-foreground/20"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-secondary" />}
                  </span>
                )}
                {item.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const NavDropdown = ({
  onLayerClick,
  onCategoryClick,
  selectedCategories,
  onClearCategories,
}: Props) => {
  const layerItems = icebergLayers.map((l) => ({ id: l.id, name: l.name }));
  const hasFilters = selectedCategories && selectedCategories.size > 0;

  return (
    <nav
      className="fixed top-4 left-4 z-[60] flex items-center gap-1 rounded-xl border border-secondary/20 bg-background/60 backdrop-blur-xl px-2 py-0"
      style={{ boxShadow: "0 0 15px rgba(20,241,149,0.1)" }}
    >
      <DropdownSection
        label="Depth"
        items={layerItems}
        onSelect={onLayerClick}
      />
      <div className="w-px h-5 bg-secondary/20" />
      <DropdownSection
        label="Category"
        items={allCategories}
        onSelect={(id) => onCategoryClick?.(id)}
        multiSelect
        selected={selectedCategories as Set<string> | undefined}
      />
      {hasFilters && (
        <>
          <div className="w-px h-5 bg-secondary/20" />
          <button
            onClick={onClearCategories}
            className="flex items-center gap-1 px-2 text-xs font-medium text-foreground/50 hover:text-secondary transition-colors"
            style={{ height: "42px" }}
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        </>
      )}
    </nav>
  );
};

export default NavDropdown;
