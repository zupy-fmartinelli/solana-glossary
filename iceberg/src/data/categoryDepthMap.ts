/**
 * Maps the SDK's 14 categories to the iceberg's 5 depth layers.
 * Also contains layer visual metadata and featured term IDs.
 */

export type Category =
  | "token-ecosystem"
  | "solana-ecosystem"
  | "web3"
  | "defi"
  | "blockchain-general"
  | "core-protocol"
  | "network"
  | "ai-ml"
  | "infrastructure"
  | "security"
  | "zk-compression"
  | "programming-model"
  | "programming-fundamentals"
  | "dev-tools";

export type DepthId = "surface" | "shallow" | "deep" | "abyss" | "bottom";

export const categoryToDepth: Record<Category, DepthId> = {
  "token-ecosystem": "surface",
  "solana-ecosystem": "surface",
  web3: "surface",
  defi: "shallow",
  "blockchain-general": "shallow",
  "core-protocol": "deep",
  network: "deep",
  "ai-ml": "deep",
  infrastructure: "abyss",
  security: "abyss",
  "zk-compression": "abyss",
  "programming-model": "bottom",
  "programming-fundamentals": "bottom",
  "dev-tools": "bottom",
};

export const depthOrder: DepthId[] = [
  "surface",
  "shallow",
  "deep",
  "abyss",
  "bottom",
];

export interface DepthMeta {
  id: DepthId;
  name: string;
  color: string;
  bgGradient: string;
  categories: Category[];
}

export const depthMeta: DepthMeta[] = [
  {
    id: "surface",
    name: "SURFACE",
    color: "hsl(200, 30%, 90%)",
    bgGradient: "linear-gradient(180deg, #1a2a4a 0%, #0f1f3a 100%)",
    categories: ["token-ecosystem", "solana-ecosystem", "web3"],
  },
  {
    id: "shallow",
    name: "SHALLOW",
    color: "hsl(210, 25%, 65%)",
    bgGradient: "linear-gradient(180deg, #0f1f3a 0%, #0a1628 100%)",
    categories: ["defi", "blockchain-general"],
  },
  {
    id: "deep",
    name: "DEEP",
    color: "hsl(215, 30%, 45%)",
    bgGradient: "linear-gradient(180deg, #0a1628 0%, #060e1a 100%)",
    categories: ["core-protocol", "network", "ai-ml"],
  },
  {
    id: "abyss",
    name: "ABYSS",
    color: "hsl(220, 40%, 25%)",
    bgGradient: "linear-gradient(180deg, #060e1a 0%, #030810 100%)",
    categories: ["infrastructure", "security", "zk-compression"],
  },
  {
    id: "bottom",
    name: "BOTTOM",
    color: "hsl(225, 50%, 12%)",
    bgGradient: "linear-gradient(180deg, #030810 0%, #020408 100%)",
    categories: ["programming-model", "programming-fundamentals", "dev-tools"],
  },
];

/** 8-12 curated term IDs per layer, seeded from the original 40 hardcoded terms. */
export const featuredTermIds: Record<DepthId, string[]> = {
  surface: [
    "wallet",
    "nft",
    "sol",
    "token",
    "transaction",
    "airdrop",
    "mint",
    "staking",
  ],
  shallow: [
    "validator",
    "rpc-node",
    "stake-pool",
    "explorer",
    "keypair",
    "program",
    "devnet",
    "lamport",
  ],
  deep: [
    "sealevel",
    "gulf-stream",
    "turbine",
    "proof-of-history",
    "cross-program-invocation",
    "program-derived-address",
    "bpf",
    "slot",
  ],
  abyss: [
    "runtime",
    "syscall",
    "epoch",
    "leader-schedule",
    "tower-bft",
    "shred",
    "turbine-tree",
    "rent",
  ],
  bottom: [
    "account-model",
    "entrypoint",
    "elf",
    "llvm",
    "merkle-tree",
    "bank",
    "fork",
    "gossip-protocol",
  ],
};

/** Human-readable labels for SDK categories */
export const categoryLabels: Record<Category, string> = {
  "token-ecosystem": "Token Ecosystem",
  "solana-ecosystem": "Solana Ecosystem",
  web3: "Web3",
  defi: "DeFi",
  "blockchain-general": "Blockchain General",
  "core-protocol": "Core Protocol",
  network: "Network",
  "ai-ml": "AI & ML",
  infrastructure: "Infrastructure",
  security: "Security",
  "zk-compression": "ZK Compression",
  "programming-model": "Programming Model",
  "programming-fundamentals": "Programming Fundamentals",
  "dev-tools": "Dev Tools",
};
