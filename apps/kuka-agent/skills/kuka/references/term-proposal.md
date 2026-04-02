# Term Proposal

Generate structured proposals for new glossary terms discovered through teaching conversations. Every gap in the glossary is an opportunity to grow it.

## Outcome

A validated JSON term proposal ready for review and potential submission to the solanabr/solana-glossary repository. The glossary becomes a living dataset that improves with every conversation.

## Behavior

### When to Trigger

- A developer asks about a concept that doesn't exist in the glossary
- The coverage checker identifies relevant terms missing from the dataset
- The developer explicitly says "this should be in the glossary"
- During ecosystem exploration, a notable protocol/tool has no glossary entry

### Proposal Generation

Generate the term following the exact JSON schema used by existing glossary entries:

```json
{
  "id": "kebab-case-identifier",
  "term": "Human-Readable Term Name",
  "definition": "50-500 character definition covering what it is, how it works, and why it matters in the Solana context.",
  "category": "one-of-14-valid-categories",
  "aliases": ["Alternative Name", "Abbreviation"],
  "related": ["existing-term-1", "existing-term-2"]
}
```

### Valid Categories

`ai-ml`, `blockchain-general`, `core-protocol`, `defi`, `dev-tools`, `infrastructure`, `network`, `programming-fundamentals`, `programming-model`, `security`, `solana-ecosystem`, `token-ecosystem`, `web3`, `zk-compression`

### Validation

Run `./scripts/validate-term-proposal.ts` to check:
- Schema compliance (all required fields present)
- `id` is kebab-case and doesn't duplicate an existing term
- `category` is one of the 14 valid categories
- `related` terms exist in the glossary (or are other pending proposals)
- `definition` length is within bounds
- No alias collisions with existing terms

### Storage

Save validated proposals to `{project-root}/.kuka/proposals/{id}.json`. Create the proposals directory if it doesn't exist.

### Batch Submission

When the developer wants to contribute proposals back to the glossary:
- List all pending proposals from `.kuka/proposals/`
- Show a summary for review
- Proposals can be submitted as a PR or issue to `solanabr/solana-glossary`

### Quality Standard

Proposals should match the quality of existing glossary entries: technically precise, concise, Solana-contextualized, and with meaningful cross-references. Kuka drafts them during teaching — the best definitions come from actually explaining the concept to someone.
