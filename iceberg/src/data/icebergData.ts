export interface Term {
  name: string;
  definition: string;
}

export interface IcebergLayer {
  id: string;
  name: string;
  terms: Term[];
  color: string;
  bgGradient: string;
}

export const icebergLayers: IcebergLayer[] = [
  {
    id: "surface",
    name: "SURFACE",
    terms: [
      {
        name: "Wallet",
        definition:
          "Definition for Wallet — A digital tool that stores your private keys and lets you interact with the Solana blockchain, send transactions, and manage your tokens.",
      },
      {
        name: "NFT",
        definition:
          "Definition for NFT — Non-Fungible Tokens on Solana are unique digital assets minted using the Metaplex standard, enabling art, gaming items, and collectibles.",
      },
      {
        name: "SOL",
        definition:
          "Definition for SOL — The native cryptocurrency of the Solana blockchain, used for transaction fees, staking, and governance.",
      },
      {
        name: "Token",
        definition:
          "Definition for Token — A digital asset created using Solana's SPL Token program, representing fungible or non-fungible value on-chain.",
      },
      {
        name: "Transaction",
        definition:
          "Definition for Transaction — An atomic unit of activity on Solana containing one or more instructions that modify on-chain state.",
      },
      {
        name: "Airdrop",
        definition:
          "Definition for Airdrop — Free distribution of tokens to wallet addresses, often used for marketing or rewarding early adopters.",
      },
      {
        name: "Mint",
        definition:
          "Definition for Mint — The process of creating new tokens or NFTs on-chain via Solana's token program.",
      },
      {
        name: "Staking",
        definition:
          "Definition for Staking — Delegating SOL to a validator to help secure the network and earn rewards in return.",
      },
    ],
    color: "hsl(200, 30%, 90%)",
    bgGradient: "linear-gradient(180deg, #1a2a4a 0%, #0f1f3a 100%)",
  },
  {
    id: "shallow",
    name: "SHALLOW",
    terms: [
      {
        name: "Validator",
        definition:
          "Definition for Validator — A node operator that processes transactions and produces blocks, securing the Solana network.",
      },
      {
        name: "RPC Node",
        definition:
          "Definition for RPC Node — A server endpoint that allows applications to read blockchain data and submit transactions.",
      },
      {
        name: "Stake Pool",
        definition:
          "Definition for Stake Pool — A program that pools SOL from multiple delegators to distribute stake across validators.",
      },
      {
        name: "Explorer",
        definition:
          "Definition for Explorer — A web tool like Solscan or Solana Explorer for viewing transactions, accounts, and blocks on-chain.",
      },
      {
        name: "Keypair",
        definition:
          "Definition for Keypair — A public key and private key pair used for signing transactions and identifying accounts.",
      },
      {
        name: "Program",
        definition:
          "Definition for Program — Smart contract code deployed on Solana, executed by the runtime when invoked by transactions.",
      },
      {
        name: "Devnet",
        definition:
          "Definition for Devnet — Solana's test network for developers to experiment without using real SOL.",
      },
      {
        name: "Lamport",
        definition:
          "Definition for Lamport — The smallest unit of SOL (0.000000001 SOL), named after Leslie Lamport.",
      },
    ],
    color: "hsl(210, 25%, 65%)",
    bgGradient: "linear-gradient(180deg, #0f1f3a 0%, #0a1628 100%)",
  },
  {
    id: "deep",
    name: "DEEP",
    terms: [
      {
        name: "Sealevel",
        definition:
          "Definition for Sealevel — Solana's parallel smart contract runtime that enables thousands of contracts to run simultaneously.",
      },
      {
        name: "Gulf Stream",
        definition:
          "Definition for Gulf Stream — Solana's mempool-less transaction forwarding protocol that pushes transactions to validators before the next block.",
      },
      {
        name: "Turbine",
        definition:
          "Definition for Turbine — Solana's block propagation protocol inspired by BitTorrent, breaking blocks into smaller packets for fast distribution.",
      },
      {
        name: "PoH",
        definition:
          "Definition for PoH — Proof of History, a cryptographic clock that timestamps transactions before consensus, enabling high throughput.",
      },
      {
        name: "Saber",
        definition:
          "Definition for Saber — A cross-chain stablecoin exchange on Solana for trading pegged assets with low slippage.",
      },
      {
        name: "CPI",
        definition:
          "Definition for CPI — Cross-Program Invocation allows one Solana program to call another program's instructions within a transaction.",
      },
      {
        name: "PDA",
        definition:
          "Definition for PDA — Program Derived Address, a deterministic address controlled by a program rather than a private key.",
      },
      {
        name: "BPF",
        definition:
          "Definition for BPF — Berkeley Packet Filter, the bytecode format Solana uses to execute on-chain programs in a sandboxed VM.",
      },
    ],
    color: "hsl(215, 30%, 45%)",
    bgGradient: "linear-gradient(180deg, #0a1628 0%, #060e1a 100%)",
  },
  {
    id: "abyss",
    name: "ABYSS",
    terms: [
      {
        name: "Runtime",
        definition:
          "Definition for Runtime — The core execution engine that processes instructions, manages accounts, and enforces Solana's rules.",
      },
      {
        name: "Syscall",
        definition:
          "Definition for Syscall — System calls available to on-chain programs for logging, cryptographic operations, and cross-program invocations.",
      },
      {
        name: "Slot",
        definition:
          "Definition for Slot — A time window (~400ms) during which a leader validator can produce a block.",
      },
      {
        name: "Epoch",
        definition:
          "Definition for Epoch — A period of ~2-3 days (432,000 slots) after which stake delegations and leader schedules update.",
      },
      {
        name: "Leader Schedule",
        definition:
          "Definition for Leader Schedule — The deterministic assignment of validators to slots for block production each epoch.",
      },
      {
        name: "Tower BFT",
        definition:
          "Definition for Tower BFT — Solana's custom BFT consensus algorithm that leverages PoH as a cryptographic clock to reduce communication overhead.",
      },
      {
        name: "Shred",
        definition:
          "Definition for Shred — A fragment of a block used by Turbine to efficiently propagate data across the network.",
      },
      {
        name: "Turbine Tree",
        definition:
          "Definition for Turbine Tree — The hierarchical fanout structure validators use to relay shreds, minimizing bandwidth requirements.",
      },
    ],
    color: "hsl(220, 40%, 25%)",
    bgGradient: "linear-gradient(180deg, #060e1a 0%, #030810 100%)",
  },
  {
    id: "bottom",
    name: "BOTTOM",
    terms: [
      {
        name: "Account Model",
        definition:
          "Definition for Account Model — Solana's data architecture where all state is stored in accounts, separating code from data.",
      },
      {
        name: "Entrypoint",
        definition:
          "Definition for Entrypoint — The function signature every Solana program must export to receive and process instructions.",
      },
      {
        name: "Relocatable ELF",
        definition:
          "Definition for Relocatable ELF — The compiled binary format for Solana programs, using ELF with BPF relocations for deployment.",
      },
      {
        name: "LLVM BPF Backend",
        definition:
          "Definition for LLVM BPF Backend — The LLVM compiler backend that compiles Rust/C to BPF bytecode for Solana programs.",
      },
      {
        name: "Merkle Root",
        definition:
          "Definition for Merkle Root — A cryptographic hash summarizing all transactions in a block, used for data integrity verification.",
      },
      {
        name: "Bank",
        definition:
          "Definition for Bank — The in-memory data structure representing the full state of all accounts at a given slot.",
      },
      {
        name: "Fork Graph",
        definition:
          "Definition for Fork Graph — The tree of possible blockchain states maintained during consensus before finalization.",
      },
      {
        name: "Gossip Protocol",
        definition:
          "Definition for Gossip Protocol — The protocol validators use to share cluster information, contact info, and votes with peers.",
      },
    ],
    color: "hsl(225, 50%, 12%)",
    bgGradient: "linear-gradient(180deg, #030810 0%, #020408 100%)",
  },
];
