import { useState } from "react";
import { Menu, X } from "lucide-react";
import { getIcebergLayers } from "@/data/glossaryAdapter";

const icebergLayers = getIcebergLayers();

interface Props {
  onLayerClick: (layerId: string) => void;
}

const HamburgerMenu = ({ onLayerClick }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-[60] p-2 rounded-lg border border-secondary/30 bg-background/60 backdrop-blur-md hover:border-secondary/60 transition-all"
        style={{ boxShadow: "0 0 15px rgba(20,241,149,0.15)" }}
      >
        {open ? (
          <X className="w-5 h-5 text-secondary" />
        ) : (
          <Menu className="w-5 h-5 text-secondary" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)}>
          <div
            className="absolute top-16 left-4 w-56 rounded-xl border border-secondary/20 bg-background/90 backdrop-blur-xl p-4"
            style={{ boxShadow: "0 0 30px rgba(20,241,149,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-secondary/60 tracking-[0.3em] uppercase mb-3">
              Layers
            </p>
            {icebergLayers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => {
                  onLayerClick(layer.id);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground/80 hover:text-secondary hover:bg-secondary/10 transition-all"
              >
                {layer.name}
                <span className="text-xs text-foreground/30 ml-2">
                  ({layer.terms.length})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default HamburgerMenu;
