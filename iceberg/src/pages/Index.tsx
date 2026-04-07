import { useState, useCallback } from "react";
import solanaLogo from "@/assets/solanaWordMark.svg";
import { AnimatePresence } from "framer-motion";
import Aurora from "@/components/Aurora";
import Stars from "@/components/Stars";
import ShootingStars from "@/components/ShootingStars";
import Sailboat from "@/components/Sailboat";
import WaveDivider from "@/components/WaveDivider";
import Fish from "@/components/Fish";
import DeepSeaCreatures from "@/components/DeepSeaCreatures";
import Bubbles from "@/components/Bubbles";
import IcebergSVG from "@/components/IcebergSVG";
import LayerView from "@/components/LayerView";
import TermView from "@/components/TermView";
import NavDropdown from "@/components/NavDropdown";
import SearchBar from "@/components/SearchBar";
import NeonCursor from "@/components/NeonCursor";
import Footer from "@/components/Footer";
import {
  getIcebergLayers,
  getRelatedTerms,
  getTermById,
  type Category,
} from "@/data/glossaryAdapter";

type View =
  | { type: "home" }
  | { type: "layer"; layerId: string }
  | { type: "term"; layerId: string; termId: string };

const icebergLayers = getIcebergLayers();

const Index = () => {
  const [view, setView] = useState<View>({ type: "home" });
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(
    new Set(),
  );

  const handleLayerClick = useCallback((layerId: string) => {
    setView({ type: "layer", layerId });
  }, []);

  const handleTermClick = useCallback((layerId: string, termId: string) => {
    setView({ type: "term", layerId, termId });
  }, []);

  const handleCategoryClick = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category as Category)) next.delete(category as Category);
      else next.add(category as Category);
      return next;
    });
  }, []);

  const currentLayer =
    view.type !== "home"
      ? icebergLayers.find((l) => l.id === view.layerId)
      : null;

  const currentLayerIndex =
    view.type !== "home"
      ? icebergLayers.findIndex((l) => l.id === view.layerId)
      : -1;

  const currentTerm = view.type === "term" ? getTermById(view.termId) : null;

  const relatedTerms = view.type === "term" ? getRelatedTerms(view.termId) : [];

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-background">
      <NeonCursor />
      <NavDropdown
        onLayerClick={handleLayerClick}
        onCategoryClick={handleCategoryClick}
        selectedCategories={selectedCategories}
        onClearCategories={() => setSelectedCategories(new Set())}
      />
      <SearchBar onTermClick={handleTermClick} />

      {/* ─── SKY SECTION ─── */}
      <div
        className="relative w-full"
        style={{
          height: "100vh",
          background: "linear-gradient(180deg, #0D0D1A 0%, #0a1628 100%)",
        }}
      >
        <div className="absolute inset-0 z-0">
          <Aurora />
        </div>
        <Stars />
        <ShootingStars />

        {/* Title */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-center"
          style={{ top: "18%" }}
        >
          <img src={solanaLogo} alt="Solana" className="h-10 md:h-16 w-auto" />
          <h1 className="text-4xl md:text-6xl font-bold tracking-[0.2em] mt-3 relative">
            <span
              className="text-secondary relative"
              style={{
                textShadow:
                  "0 0 20px rgba(20,241,149,0.5), 0 0 40px rgba(20,241,149,0.3), 0 0 60px rgba(20,241,149,0.15)",
              }}
            >
              ICEBERG
            </span>
          </h1>
          <p className="text-muted-foreground/50 text-base md:text-lg mt-2 tracking-widest uppercase">
            Interactive Glossary
          </p>
          <div
            className="absolute -inset-12 -z-10 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(20,241,149,0.15) 0%, rgba(153,69,255,0.08) 40%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <Sailboat />
          <WaveDivider />
          {/* Green-to-blue gradient below waterline */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(20, 241, 149, 0.08) 0%, rgba(10, 22, 40, 0.4) 40%, rgba(10, 22, 40, 0.8) 100%)",
              transform: "translateY(100%)",
            }}
          />
        </div>
      </div>

      {/* ─── UNDERWATER SECTION ─── */}
      <div className="relative w-full">
        {/* Sea creatures layer — clipped to underwater */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #0A1628 0%, #020408 100%)",
            contain: "paint",
          }}
        >
          <Fish />
          <DeepSeaCreatures />
          <Bubbles />
        </div>

        {/* Iceberg — overflows above waterline into sky */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-full z-20"
          style={{ top: "calc(-33vw)", maxWidth: "4000px" }}
        >
          <IcebergSVG
            onLayerClick={handleLayerClick}
            onTermClick={handleTermClick}
            selectedCategories={selectedCategories}
          />
        </div>

        <div style={{ height: "calc(233.33vw - 33vw)" }} />
        <div className="h-[10vh]" />
      </div>

      {/* ─── SOLANA TRANCHES ─── */}
      <div
        className="relative w-full flex flex-col items-center justify-center py-20"
        style={{
          background: "linear-gradient(180deg, #020408 0%, #0D0D1A 100%)",
        }}
      >
        <img src={solanaLogo} alt="Solana" className="h-8 md:h-12 w-auto" />
        <h2 className="text-3xl md:text-5xl font-bold tracking-[0.2em] mt-3 relative">
          <span
            className="text-secondary relative"
            style={{
              textShadow:
                "0 0 20px rgba(20,241,149,0.5), 0 0 40px rgba(20,241,149,0.3), 0 0 60px rgba(20,241,149,0.15)",
            }}
          >
            TRANCHES
          </span>
        </h2>
        <div
          className="absolute -inset-12 -z-10 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(20,241,149,0.1) 0%, rgba(153,69,255,0.06) 40%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      {/* Footer */}
      <Footer />

      {/* ─── Layer & Term overlays ─── */}
      <AnimatePresence mode="wait">
        {view.type === "layer" && currentLayer && (
          <LayerView
            key={`layer-${currentLayer.id}`}
            layer={currentLayer}
            layerIndex={currentLayerIndex}
            selectedCategories={selectedCategories}
            onBack={() => setView({ type: "home" })}
            onTermClick={(termId) => handleTermClick(currentLayer.id, termId)}
          />
        )}
        {view.type === "term" && currentTerm && (
          <TermView
            key={`term-${currentTerm.id}`}
            term={currentTerm}
            layerId={view.layerId}
            relatedTerms={relatedTerms}
            onBack={() => setView({ type: "layer", layerId: view.layerId })}
            onHome={() => setView({ type: "home" })}
            onTermClick={handleTermClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
