// SPDX-License-Identifier: MIT
import { z } from "zod";

export const MODES = ["single", "batch"] as const;
export type RevcompMode = (typeof MODES)[number];

export const LINE_WRAPS = ["none", "60", "80"] as const;
export type LineWrap = (typeof LINE_WRAPS)[number];

export const OUTPUT_NUCLEOTIDES = ["dna", "rna"] as const;
export type OutputNucleotide = (typeof OUTPUT_NUCLEOTIDES)[number];

export const batchRowInputSchema = z.object({
  name: z.string().optional(),
  sequence: z.string().min(1),
});
export type BatchRowInput = z.infer<typeof batchRowInputSchema>;

export const dnaRevcompInputSchema = z.object({
  mode: z.enum(MODES),
  sequence: z.string().optional(),
  batch_rows: z.array(batchRowInputSchema).optional(),
  batch_text: z.string().optional(),
  batch_csv: z.string().optional(),
  uppercase: z.boolean().default(true).optional(),
  fasta_header: z.boolean().default(false).optional(),
  line_wrap: z.enum(LINE_WRAPS).default("none").optional(),
  output_nucleotide: z.enum(OUTPUT_NUCLEOTIDES).default("dna").optional(),
});
export type DnaRevcompInput = z.infer<typeof dnaRevcompInputSchema>;

export function parseRunInput(input: unknown): DnaRevcompInput {
  return dnaRevcompInputSchema.parse(input);
}
