// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { parseRunInput } from "../src/schemas.js";
import { PepkioAPIError, type ToolManifest } from "../src/types.js";

const mockManifest: ToolManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "DNA RevComp & Primer Toolkit",
  description: "Reverse, complement, and reverse-complement DNA with inline primer QC.",
  examples: [
    {
      name: "single_gapdh_primer",
      description: "GAPDH single primer test",
      input: {
        mode: "single",
        sequence: "GAAGGTGAAGGTCGGAGTC",
        uppercase: true,
        line_wrap: "none",
        output_nucleotide: "dna",
      },
    },
    {
      name: "batch_two_primers",
      description: "Batch two primers test",
      input: {
        mode: "batch",
        batch_text: "GAPDH_F,GAAGGTGAAGGTCGGAGTC\nACTB_F,GGCTGGGGTGTTGAAGGT\n",
      },
    },
  ],
};

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("resolves default production base URL", () => {
    delete process.env.PEPKIO_API_BASE_URL;
    expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it("resolves base URL override parameter over env", () => {
    process.env.PEPKIO_API_BASE_URL = "https://env.pepkio.com";
    expect(resolveBaseUrl("https://override.pepkio.com/")).toBe(
      "https://override.pepkio.com",
    );
  });

  it("resolves base URL from env if no override", () => {
    process.env.PEPKIO_API_BASE_URL = "https://tools.localtest.me/";
    expect(resolveBaseUrl()).toBe("https://tools.localtest.me");
  });

  it("resolves API key for production", () => {
    process.env.PEPKIO_API_KEY = "prod-key";
    delete process.env.LOCAL_PEPKIO_API_KEY;
    expect(resolveApiKey("https://tools.pepkio.com")).toBe("prod-key");
  });

  it("resolves local API key for localtest.me", () => {
    process.env.PEPKIO_API_KEY = "prod-key";
    process.env.LOCAL_PEPKIO_API_KEY = "local-key";
    expect(resolveApiKey("https://tools.localtest.me")).toBe("local-key");
  });

  it("falls back to PEPKIO_API_KEY for localtest.me if LOCAL_PEPKIO_API_KEY is unset", () => {
    process.env.PEPKIO_API_KEY = "fallback-key";
    delete process.env.LOCAL_PEPKIO_API_KEY;
    expect(resolveApiKey("https://tools.localtest.me")).toBe("fallback-key");
  });

  it("builds correct API path", () => {
    expect(apiPath("https://tools.pepkio.com", "/tools/dna-revcomp-primer-toolkit/manifest")).toBe(
      "https://tools.pepkio.com/api/tools/v1/tools/dna-revcomp-primer-toolkit/manifest",
    );
    expect(apiPath("https://tools.pepkio.com", "runs/123")).toBe(
      "https://tools.pepkio.com/api/tools/v1/runs/123",
    );
  });
});

describe("schemas", () => {
  it("parses single mode input", () => {
    const parsed = parseRunInput({
      mode: "single",
      sequence: "ATGC",
    });
    expect(parsed.mode).toBe("single");
    expect(parsed.sequence).toBe("ATGC");
    expect(parsed.uppercase).toBe(true);
    expect(parsed.line_wrap).toBe("none");
    expect(parsed.output_nucleotide).toBe("dna");
  });

  it("parses batch mode input", () => {
    const parsed = parseRunInput({
      mode: "batch",
      batch_rows: [{ name: "P1", sequence: "ACGT" }],
      output_nucleotide: "rna",
    });
    expect(parsed.mode).toBe("batch");
    expect(parsed.batch_rows).toHaveLength(1);
    expect(parsed.output_nucleotide).toBe("rna");
  });

  it("rejects invalid mode", () => {
    expect(() =>
      parseRunInput({
        mode: "invalid_mode",
      }),
    ).toThrow();
  });
});

describe("PepkioClient unit tests", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("fetches and caches manifest", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockManifest),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ baseUrl: "https://tools.pepkio.com" });
    const manifest = await client.getManifest();
    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://tools.pepkio.com/api/tools/v1/tools/dna-revcomp-primer-toolkit/manifest",
    );

    // Second call should use cache
    const cached = await client.getManifest();
    expect(cached).toBe(manifest);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("lists examples from manifest", async () => {
    const client = new PepkioClient();
    const examples = client.listExamples(mockManifest);
    expect(examples).toHaveLength(2);
    expect(examples[0].name).toBe("single_gapdh_primer");
  });

  it("gets example input by name", async () => {
    const client = new PepkioClient();
    const input = await client.getExampleInput("single_gapdh_primer", mockManifest);
    expect(input.mode).toBe("single");
    expect(input.sequence).toBe("GAAGGTGAAGGTCGGAGTC");
  });

  it("throws for unknown example", async () => {
    const client = new PepkioClient();
    await expect(
      client.getExampleInput("non_existent_example", mockManifest),
    ).rejects.toThrow(/not found/);
  });

  it("throws when running without API key", async () => {
    const client = new PepkioClient({ apiKey: "" });
    await expect(
      client.run({ mode: "single", sequence: "ATGC" }),
    ).rejects.toThrow(PepkioAPIError);
  });

  it("sends run request with correct auth and payload", async () => {
    const mockResponse = {
      run_id: "run-123",
      status: "completed",
      result: {
        mode: "single",
        format: {
          uppercase: true,
          fasta_header: false,
          line_wrap: "none",
          output_nucleotide: "dna",
        },
        single: {
          input: "ATGC",
          reverse: "CGTA",
          complement: "TACG",
          rev_complement: "GCAT",
          qc: {
            gc_percent: 50,
            tm_wallace_c: 12,
            length_nt: 4,
            degenerate_bases: [],
            degenerate_positions: [],
            flags: [],
          },
          chars_removed: 0,
        },
        warnings: [],
      },
      error: null,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    const res = await client.run({
      mode: "single",
      sequence: "ATGC",
    });

    expect(res.run_id).toBe("run-123");
    expect(res.result?.single?.rev_complement).toBe("GCAT");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://tools.pepkio.com/api/tools/v1/tools/dna-revcomp-primer-toolkit/run");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-token");
  });

  it("convenience revcompSingle formats input correctly", async () => {
    const mockResponse = {
      run_id: "run-single",
      status: "completed",
      result: { mode: "single" },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    await client.revcompSingle("ATGC", {
      outputNucleotide: "rna",
      lineWrap: "60",
    });

    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.input.mode).toBe("single");
    expect(body.input.sequence).toBe("ATGC");
    expect(body.input.output_nucleotide).toBe("rna");
    expect(body.input.line_wrap).toBe("60");
  });

  it("convenience revcompBatch formats input correctly", async () => {
    const mockResponse = {
      run_id: "run-batch",
      status: "completed",
      result: { mode: "batch" },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockResponse),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    await client.revcompBatch({
      batchText: "P1,ATGC\nP2,CGTA\n",
    });

    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.input.mode).toBe("batch");
    expect(body.input.batch_text).toBe("P1,ATGC\nP2,CGTA\n");
  });

  it("throws PepkioAPIError on HTTP 400 error response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => JSON.stringify({ error: { message: "Invalid payload", code: "INVALID_INPUT" } }),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    await expect(
      client.run({ mode: "single", sequence: "ATGC" }),
    ).rejects.toThrow("Invalid payload");
  });

  it("throws PepkioAPIError when envelope error is present", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "run-err",
          status: "failed",
          error: "Calculation failed unexpectedly",
        }),
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    await expect(
      client.run({ mode: "single", sequence: "ATGC" }),
    ).rejects.toThrow("Calculation failed unexpectedly");
  });

  it("polls run until completion in waitForRun", async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              run_id: "run-async",
              status: "running",
              error: null,
            }),
        };
      }
      return {
        ok: true,
        text: async () =>
          JSON.stringify({
            run_id: "run-async",
            status: "completed",
            result: { mode: "single" },
            error: null,
          }),
      };
    });
    globalThis.fetch = mockFetch;

    const client = new PepkioClient({ apiKey: "test-token" });
    const res = await client.waitForRun("run-async", { intervalMs: 10, timeoutMs: 500 });
    expect(res.status).toBe("completed");
    expect(callCount).toBe(2);
  });
});
