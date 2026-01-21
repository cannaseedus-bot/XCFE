/**
 * XCFE Consensus Inspection v1
 *
 * @artifact xcfe://cli/consensus/v1
 */

import fs from "fs";
import path from "path";
import { error, flag } from "./router.js";

const DEFAULT_FILE = path.join(".xjson", "consensus.json");

/**
 * xcfe consensus show [--file path]
 */
export function cmdConsensus(args) {
  const [subcommand] = args;
  if (subcommand !== "show") {
    throw error("Usage: xcfe consensus show [--file path]", 64);
  }

  const file = flag(args, "--file") ?? DEFAULT_FILE;
  if (!fs.existsSync(file)) {
    throw error(`Consensus file not found: ${file}`, 66);
  }

  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  const metrics = disagreementMetrics(payload);

  console.log(`Agreement: ${(metrics.agreementRatio * 100).toFixed(0)}%`);
  if (!metrics.contestedGrams.length) {
    console.log("Contested grams: none");
  } else {
    console.log("Contested grams:");
    for (const gram of metrics.contestedGrams) {
      console.log(`  - ${gram}`);
    }
  }

  if (metrics.perOracleVotes.length) {
    console.log("Votes:");
    for (const [gram, votes] of metrics.perOracleVotes) {
      console.log(`  ${gram}: ${votes}`);
    }
  }
}

export function disagreementMetrics(consensus) {
  const agreed = normalizeArray(consensus.agreed);
  const contested = normalizeArray(consensus.rejected ?? consensus.contested_grams ?? consensus.contestedGrams);
  const votes = normalizeVotes(consensus.votes ?? consensus.per_oracle_votes ?? consensus.perOracleVotes);

  const totalVotes = votes.reduce((sum, [, count]) => sum + count, 0) || 1;
  const agreementRatio = agreed.length / totalVotes;

  return {
    agreementRatio,
    contestedGrams: contested,
    perOracleVotes: votes
  };
}

function normalizeArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeVotes(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (Array.isArray(entry)) return [String(entry[0]), Number(entry[1]) || 0];
      if (typeof entry === "object") return [String(entry.gram ?? entry[0]), Number(entry.votes ?? entry[1]) || 0];
      return [String(entry), 0];
    });
  }
  if (typeof value === "object") {
    return Object.entries(value).map(([gram, votes]) => [gram, Number(votes) || 0]);
  }
  return [];
}
