// SPDX-License-Identifier: MIT
import type {
  BatchRowInput,
  DnaRevcompInput,
  LineWrap,
  OutputNucleotide,
  RevcompMode,
} from "./schemas.js";

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface RunResult<T = DnaRevcompResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export interface RevcompFlag {
  level: "info" | "warn" | "orange" | (string & {});
  code: string;
  message: string;
}

export interface DegeneratePosition {
  base: string;
  position: number;
}

export interface QcMetrics {
  gc_percent: number;
  tm_wallace_c: number;
  length_nt: number;
  degenerate_bases: string[];
  degenerate_positions: DegeneratePosition[];
  flags: RevcompFlag[];
}

export interface SingleResult {
  name?: string;
  input: string;
  reverse: string;
  complement: string;
  rev_complement: string;
  qc: QcMetrics;
  chars_removed: number;
  error?: string;
  invalid_char?: { char: string; position: number };
}

export interface BatchRowResult extends SingleResult {
  row_index: number;
  skipped?: boolean;
}

export interface FormatOptions {
  uppercase: boolean;
  fasta_header: boolean;
  line_wrap: LineWrap;
  output_nucleotide: OutputNucleotide;
  sequence_name?: string;
}

export interface RevcompWarning {
  level: "info" | "warn" | "error" | (string & {});
  message: string;
  row?: number;
}

export interface DnaRevcompResult {
  mode: RevcompMode;
  format: FormatOptions;
  single?: SingleResult;
  batch?: BatchRowResult[];
  warnings?: RevcompWarning[];
  error?: string | null;
  metadata?: {
    batch_truncated?: boolean;
    batch_total_parsed?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;
  readonly code?: string;

  constructor(
    message: string,
    opts: { status: number; body?: unknown; runId?: string; code?: string },
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
    this.code = opts.code;
  }
}
