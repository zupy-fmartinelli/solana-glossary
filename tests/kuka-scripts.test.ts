import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const SCRIPTS_DIR = "apps/kuka-agent/skills/kuka/scripts";
const GLOSSARY_DIR = "data/terms";
const TMP_DIR = join("tests", ".tmp-kuka");

function runScript(script: string, args: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`npx tsx ${join(SCRIPTS_DIR, script)} ${args}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, exitCode: 0 };
  } catch (err: any) {
    return { stdout: err.stdout ?? "", exitCode: err.status ?? 1 };
  }
}

describe("glossary-coverage.ts", () => {
  it("shows help with --help", () => {
    const { stdout, exitCode } = runScript("glossary-coverage.ts", "--help");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Glossary Coverage Checker");
    expect(stdout).toContain("--topic");
  });

  it("fails without required args", () => {
    const { exitCode } = runScript("glossary-coverage.ts", "");
    expect(exitCode).not.toBe(0);
  });

  it("matches terms for a ZK compression topic", () => {
    const { stdout } = runScript(
      "glossary-coverage.ts",
      `--topic "compressed tokens light protocol merkle tree"`,
    );
    const result = JSON.parse(stdout);
    expect(result.script).toBe("glossary-coverage");
    expect(result.matched_terms).toBeGreaterThan(0);
    expect(result.terms.gaps).toContain("zk-compression");
    expect(result.terms.gaps).toContain("light-protocol");
    expect(result.terms.gaps).toContain("compressed-token");
  });

  it("matches terms from comma-separated IDs", () => {
    const { stdout } = runScript(
      "glossary-coverage.ts",
      `--terms "pda,cpi,spl-token"`,
    );
    const result = JSON.parse(stdout);
    expect(result.matched_terms).toBeGreaterThan(0);
  });

  it("respects --max-results", () => {
    const { stdout } = runScript(
      "glossary-coverage.ts",
      `--topic "solana blockchain defi tokens" --max-results 5`,
    );
    const result = JSON.parse(stdout);
    expect(result.matched_terms).toBeLessThanOrEqual(5);
  });

  it("recognizes explored terms from progress file", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const progressPath = join(TMP_DIR, "progress.md");
    writeFileSync(progressPath, "## Explored\n- zk-compression\n- light-protocol\n- compressed-token\n");

    const { stdout } = runScript(
      "glossary-coverage.ts",
      `--topic "compressed tokens light protocol" --progress ${progressPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.explored).toBeGreaterThan(0);
    expect(result.terms.explored).toContain("zk-compression");

    rmSync(TMP_DIR, { recursive: true, force: true });
  });
});

describe("validate-term-proposal.ts", () => {
  it("shows help with --help", () => {
    const { stdout, exitCode } = runScript("validate-term-proposal.ts", "--help");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Term Proposal Validator");
    expect(stdout).toContain("--proposal");
  });

  it("passes a valid proposal", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "valid-proposal.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "test-valid-term",
        term: "Test Valid Term",
        definition:
          "A test term used to validate the proposal validator script works correctly with valid input data.",
        category: "dev-tools",
        aliases: ["TVT"],
        related: ["anchor-framework"],
      }),
    );

    const { stdout, exitCode } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.status).toBe("pass");
    expect(result.summary.critical).toBe(0);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("fails on missing required fields", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "incomplete.json");
    writeFileSync(proposalPath, JSON.stringify({ id: "missing-fields" }));

    const { stdout, exitCode } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.status).toBe("fail");
    expect(result.summary.critical).toBeGreaterThan(0);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("fails on duplicate ID", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "duplicate.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "proof-of-history",
        term: "Proof of History Duplicate",
        definition:
          "This is a duplicate term that should be rejected because proof-of-history already exists in the glossary.",
        category: "core-protocol",
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.status).toBe("fail");
    expect(result.findings.some((f: any) => f.issue.includes("already exists"))).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("warns on invalid category", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "bad-category.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "bad-category-term",
        term: "Bad Category Term",
        definition:
          "A test term with an invalid category to verify the validator catches this correctly.",
        category: "nonexistent-category",
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.status).toBe("fail");
    expect(result.findings.some((f: any) => f.issue.includes("Invalid category"))).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("warns on short definition", () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const proposalPath = join(TMP_DIR, "short-def.json");
    writeFileSync(
      proposalPath,
      JSON.stringify({
        id: "short-def-term",
        term: "Short Def",
        definition: "Too short.",
        category: "dev-tools",
      }),
    );

    const { stdout } = runScript(
      "validate-term-proposal.ts",
      `--proposal ${proposalPath}`,
    );
    const result = JSON.parse(stdout);
    expect(result.findings.some((f: any) => f.issue.includes("too short"))).toBe(true);

    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("accepts proposal from stdin", () => {
    const proposal = JSON.stringify({
      id: "stdin-test-term",
      term: "Stdin Test Term",
      definition:
        "A test term piped through stdin to verify the validator can read from standard input correctly.",
      category: "dev-tools",
    });

    try {
      const stdout = execSync(
        `echo '${proposal}' | npx tsx ${join(SCRIPTS_DIR, "validate-term-proposal.ts")} --proposal -`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      );
      const result = JSON.parse(stdout);
      expect(result.status).toBe("pass");
    } catch (err: any) {
      const result = JSON.parse(err.stdout);
      expect(result.proposal_id).toBe("stdin-test-term");
    }
  });
});
