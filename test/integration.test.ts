// SPDX-License-Identifier: MIT
import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { DEFAULT_API_BASE_URL, TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("DNA RevComp & Primer Toolkit");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("single_gapdh_primer");
      expect(names).toContain("batch_two_primers");
      expect(names).toContain("iupac_degenerate");
      expect(names).toContain("invalid_character");
    },
    30_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs single_gapdh_primer example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("single_gapdh_primer");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.mode).toBe("single");
      expect(result.result?.single?.rev_complement).toBe("GACTCCGACCTTCACCTTC");
      expect(result.result?.single?.qc.length_nt).toBe(19);
      expect(result.result?.single?.qc.gc_percent).toBeGreaterThan(50);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs batch_two_primers example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("batch_two_primers");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.mode).toBe("batch");
      expect(result.result?.batch).toBeDefined();
      expect(result.result?.batch?.length).toBe(2);
      expect(result.result?.batch?.[0].name).toBe("GAPDH_F");
      expect(result.result?.batch?.[0].rev_complement).toBe("GACTCCGACCTTCACCTTC");
      expect(result.result?.batch?.[1].name).toBe("ACTB_F");
      expect(result.result?.batch?.[1].rev_complement).toBe("ACCTTCAACACCCCAGCC");
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs iupac_degenerate example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("iupac_degenerate");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.single?.qc.degenerate_bases.length).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs invalid_character example gracefully",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("invalid_character");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.result).toBeDefined();
      expect(result.result?.single?.error).toContain("Invalid character");
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs convenience revcompSingle helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.revcompSingle("ATGCATGC", {
        outputNucleotide: "dna",
      });

      expect(result.status).toBe("completed");
      expect(result.result?.single?.rev_complement).toBe("GCATGCAT");
      expect(result.result?.single?.reverse).toBe("CGTACGTA");
      expect(result.result?.single?.complement).toBe("TACGTACG");
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs convenience revcompBatch helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.revcompBatch({
        batchRows: [
          { name: "oligo_a", sequence: "AAGCTT" },
          { name: "oligo_b", sequence: "GGATCC" },
        ],
      });

      expect(result.status).toBe("completed");
      expect(result.result?.batch?.length).toBe(2);
      expect(result.result?.batch?.[0].rev_complement).toBe("AAGCTT");
      expect(result.result?.batch?.[1].rev_complement).toBe("GGATCC");
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs and fetches run via getRun()",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("single_gapdh_primer");
      const initial = await client.run(input);

      expect(initial.run_id).toBeTruthy();
      const fetched = await client.getRun(initial.run_id);
      expect(fetched.run_id).toBe(initial.run_id);
      expect(fetched.status).toBe("completed");
      expect(fetched.result?.single?.rev_complement).toBe("GACTCCGACCTTCACCTTC");
    },
    60_000,
  );
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("DNA RevComp & Primer Toolkit");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("single_gapdh_primer");
      expect(names).toContain("batch_two_primers");
      expect(names).toContain("iupac_degenerate");
      expect(names).toContain("invalid_character");
    },
    30_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs single_gapdh_primer example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("single_gapdh_primer");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.mode).toBe("single");
      expect(result.result?.single?.rev_complement).toBe("GACTCCGACCTTCACCTTC");
      expect(result.result?.single?.qc.length_nt).toBe(19);
      expect(result.result?.single?.qc.gc_percent).toBeGreaterThan(50);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs batch_two_primers example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("batch_two_primers");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.mode).toBe("batch");
      expect(result.result?.batch).toBeDefined();
      expect(result.result?.batch?.length).toBe(2);
      expect(result.result?.batch?.[0].name).toBe("GAPDH_F");
      expect(result.result?.batch?.[0].rev_complement).toBe("GACTCCGACCTTCACCTTC");
      expect(result.result?.batch?.[1].name).toBe("ACTB_F");
      expect(result.result?.batch?.[1].rev_complement).toBe("ACCTTCAACACCCCAGCC");
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs iupac_degenerate example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("iupac_degenerate");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.single?.qc.degenerate_bases.length).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs invalid_character example gracefully",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("invalid_character");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.result).toBeDefined();
      expect(result.result?.single?.error).toContain("Invalid character");
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs convenience revcompSingle helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.revcompSingle("ATGCATGC", {
        outputNucleotide: "dna",
      });

      expect(result.status).toBe("completed");
      expect(result.result?.single?.rev_complement).toBe("GCATGCAT");
      expect(result.result?.single?.reverse).toBe("CGTACGTA");
      expect(result.result?.single?.complement).toBe("TACGTACG");
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs convenience revcompBatch helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.revcompBatch({
        batchRows: [
          { name: "oligo_a", sequence: "AAGCTT" },
          { name: "oligo_b", sequence: "GGATCC" },
        ],
      });

      expect(result.status).toBe("completed");
      expect(result.result?.batch?.length).toBe(2);
      expect(result.result?.batch?.[0].rev_complement).toBe("AAGCTT");
      expect(result.result?.batch?.[1].rev_complement).toBe("GGATCC");
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs and fetches run via getRun()",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("single_gapdh_primer");
      const initial = await client.run(input);

      expect(initial.run_id).toBeTruthy();
      const fetched = await client.getRun(initial.run_id);
      expect(fetched.run_id).toBe(initial.run_id);
      expect(fetched.status).toBe("completed");
      expect(fetched.result?.single?.rev_complement).toBe("GACTCCGACCTTCACCTTC");
    },
    60_000,
  );
});

describe("integration: config defaults", () => {
  it("uses production base URL by default", () => {
    expect(DEFAULT_API_BASE_URL).toBe("https://tools.pepkio.com");
  });
});
