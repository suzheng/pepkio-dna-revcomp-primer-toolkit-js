// SPDX-License-Identifier: MIT

export {
  PepkioClient,
  type PepkioClientOptions,
  type SingleRevcompOptions,
  type BatchRevcompOptions,
} from "./client.js";

export {
  TOOL_ID,
  DEFAULT_API_BASE_URL,
  resolveBaseUrl,
  resolveApiKey,
  apiPath,
} from "./config.js";

export {
  MODES,
  LINE_WRAPS,
  OUTPUT_NUCLEOTIDES,
  batchRowInputSchema,
  dnaRevcompInputSchema,
  parseRunInput,
  type RevcompMode,
  type LineWrap,
  type OutputNucleotide,
  type BatchRowInput,
  type DnaRevcompInput,
} from "./schemas.js";

export {
  PepkioAPIError,
  type RunStatus,
  type RunOptions,
  type RunResult,
  type ManifestExample,
  type ToolManifest,
  type ExampleMeta,
  type RevcompFlag,
  type DegeneratePosition,
  type QcMetrics,
  type SingleResult,
  type BatchRowResult,
  type FormatOptions,
  type RevcompWarning,
  type DnaRevcompResult,
} from "./types.js";
