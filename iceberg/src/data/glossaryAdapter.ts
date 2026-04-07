/**
 * Bridge between the @stbr/solana-glossary SDK data and the frontend.
 * All components import from here — never from the SDK directly.
 */

import aiMl from "@stbr/solana-glossary/data/terms/ai-ml.json";
import blockchainGeneral from "@stbr/solana-glossary/data/terms/blockchain-general.json";
import coreProtocol from "@stbr/solana-glossary/data/terms/core-protocol.json";
import defi from "@stbr/solana-glossary/data/terms/defi.json";
import devTools from "@stbr/solana-glossary/data/terms/dev-tools.json";
import infrastructure from "@stbr/solana-glossary/data/terms/infrastructure.json";
import network from "@stbr/solana-glossary/data/terms/network.json";
import programmingFundamentals from "@stbr/solana-glossary/data/terms/programming-fundamentals.json";
import programmingModel from "@stbr/solana-glossary/data/terms/programming-model.json";
import security from "@stbr/solana-glossary/data/terms/security.json";
import solanaEcosystem from "@stbr/solana-glossary/data/terms/solana-ecosystem.json";
import tokenEcosystem from "@stbr/solana-glossary/data/terms/token-ecosystem.json";
import web3 from "@stbr/solana-glossary/data/terms/web3.json";
import zkCompression from "@stbr/solana-glossary/data/terms/zk-compression.json";

import {
  type Category,
  type DepthId,
  categoryToDepth,
  depthMeta,
  depthOrder,
  featuredTermIds,
} from "./categoryDepthMap";

// ─── Raw SDK type ───
interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: Category;
  related?: string[];
  aliases?: string[];
}

// ─── Frontend types ───
export interface Term {
  id: string;
  name: string;
  definition: string;
  category?: Category;
  related?: string[];
  aliases?: string[];
}

export interface IcebergLayer {
  id: string;
  name: string;
  terms: Term[];
  color: string;
  bgGradient: string;
  categories: Category[];
}

// ─── Load all terms ───
const rawTermsByCategory: Record<Category, GlossaryTerm[]> = {
  "ai-ml": aiMl as GlossaryTerm[],
  "blockchain-general": blockchainGeneral as GlossaryTerm[],
  "core-protocol": coreProtocol as GlossaryTerm[],
  defi: defi as GlossaryTerm[],
  "dev-tools": devTools as GlossaryTerm[],
  infrastructure: infrastructure as GlossaryTerm[],
  network: network as GlossaryTerm[],
  "programming-fundamentals": programmingFundamentals as GlossaryTerm[],
  "programming-model": programmingModel as GlossaryTerm[],
  security: security as GlossaryTerm[],
  "solana-ecosystem": solanaEcosystem as GlossaryTerm[],
  "token-ecosystem": tokenEcosystem as GlossaryTerm[],
  web3: web3 as GlossaryTerm[],
  "zk-compression": zkCompression as GlossaryTerm[],
};

/** All 1001 terms as frontend Term objects */
const allTermsArray: Term[] = Object.values(rawTermsByCategory)
  .flat()
  .map((t) => ({
    id: t.id,
    name: t.term,
    definition: t.definition,
    category: t.category,
    related: t.related,
    aliases: t.aliases,
  }));

/** Quick lookup by ID or alias (case-insensitive for aliases) */
const termById = new Map<string, Term>();
const termByAlias = new Map<string, Term>();

for (const term of allTermsArray) {
  termById.set(term.id, term);
  if (term.aliases) {
    for (const alias of term.aliases) {
      termByAlias.set(alias.toLowerCase(), term);
    }
  }
}

// ─── Build layers ───
function buildLayers(
  termFilter?: (term: Term, depthId: DepthId) => boolean,
): IcebergLayer[] {
  return depthOrder.map((depthId) => {
    const meta = depthMeta.find((m) => m.id === depthId)!;
    const categories = meta.categories;

    let terms: Term[] = [];
    for (const cat of categories) {
      const catTerms = (rawTermsByCategory[cat] ?? []).map((t) => ({
        id: t.id,
        name: t.term,
        definition: t.definition,
        category: t.category as Category,
        related: t.related,
        aliases: t.aliases,
      }));
      terms.push(...catTerms);
    }

    if (termFilter) {
      terms = terms.filter((t) => termFilter(t, depthId));
    }

    // Sort alphabetically within each layer
    terms.sort((a, b) => a.name.localeCompare(b.name));

    return {
      id: meta.id,
      name: meta.name,
      terms,
      color: meta.color,
      bgGradient: meta.bgGradient,
      categories,
    };
  });
}

/** All terms grouped by depth layer */
export function getIcebergLayers(): IcebergLayer[] {
  return buildLayers();
}

/** Only the curated featured terms (for iceberg SVG display) */
export function getFeaturedLayers(): IcebergLayer[] {
  return buildLayers((term, depthId) => {
    const featured = featuredTermIds[depthId];
    return featured.includes(term.id);
  });
}

/** Search across all 1001 terms (names, definitions, aliases) */
export function searchAllTerms(
  query: string,
): { layerId: string; term: Term; matchedAlias?: string }[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();

  const results: { layerId: string; term: Term; matchedAlias?: string }[] = [];

  for (const term of allTermsArray) {
    const depthId = term.category ? categoryToDepth[term.category] : undefined;
    if (!depthId) continue;

    const nameMatch = term.name.toLowerCase().includes(q);
    const defMatch = term.definition.toLowerCase().includes(q);
    const aliasMatch = term.aliases?.find((a) => a.toLowerCase().includes(q));

    if (nameMatch || defMatch || aliasMatch) {
      results.push({
        layerId: depthId,
        term,
        matchedAlias: aliasMatch && !nameMatch ? aliasMatch : undefined,
      });
    }
  }

  // Sort: name matches first, then alias matches, then definition matches
  results.sort((a, b) => {
    const aName = a.term.name.toLowerCase().includes(q) ? 0 : 1;
    const bName = b.term.name.toLowerCase().includes(q) ? 0 : 1;
    if (aName !== bName) return aName - bName;
    const aAlias = a.matchedAlias ? 0 : 1;
    const bAlias = b.matchedAlias ? 0 : 1;
    return aAlias - bAlias;
  });

  return results;
}

/** Get related terms for a given term ID, resolved across layers */
export function getRelatedTerms(
  termId: string,
): { layerId: string; term: Term }[] {
  const source = termById.get(termId);
  if (!source?.related) return [];

  return source.related
    .map((relId) => {
      const term = termById.get(relId);
      if (!term) return null;
      const layerId = term.category
        ? categoryToDepth[term.category]
        : undefined;
      if (!layerId) return null;
      return { layerId, term };
    })
    .filter((r): r is { layerId: string; term: Term } => r !== null);
}

/** Get a single term by ID or alias */
export function getTermById(idOrAlias: string): Term | undefined {
  return termById.get(idOrAlias) ?? termByAlias.get(idOrAlias.toLowerCase());
}

/** All 1001 terms flat */
export const allTerms = allTermsArray;

/** All categories */
export { type Category, categoryToDepth, depthMeta, depthOrder };
export { categoryLabels } from "./categoryDepthMap";
