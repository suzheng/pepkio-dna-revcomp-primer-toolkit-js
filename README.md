# Pepkio DNA RevComp & Primer Toolkit

Typed Node.js and TypeScript client for DNA and RNA reverse complementation, IUPAC degenerate nucleotide resolution, and biophysical primer QC via the Pepkio Tools REST API.

# What It Does

In molecular biology, designing reverse PCR primers, sequencing oligos, and hybridization probes requires converting target sequences into their antiparallel 5' to 3' reverse complements. Manual sequence editing or basic character reversal easily causes orientation errors (leaving sequences in the 3' to 5' direction), complement errors, or failures with IUPAC degenerate bases.

This package provides a typed Node.js and browser TypeScript client alongside a command-line interface (CLI) for the hosted Pepkio DNA RevComp & Primer Toolkit REST API. It converts DNA and RNA sequences into exact reverse complement, complement, or reversed formats, decodes IUPAC ambiguity codes, and evaluates essential primer quality control (QC) metrics—including Wallace melting temperature ($T_m$), GC content percentage, length, and warning flags.

Programmatic runs require an active network connection and a Pepkio API key. Calculations are executed remotely by the Pepkio API engine.

# Features

- **Directional Transformations**: Generates exact 5' $\rightarrow$ 3' Reverse Complement, 5' $\rightarrow$ 3' Complement, 3' $\rightarrow$ 5' Reverse, and DNA-RNA conversions.
- **IUPAC Degenerate Base Decoding**: Full complementary mapping for nucleic acid ambiguity codes (R, Y, S, W, K, M, B, D, H, V, N).
- **Inline Primer Quality Control**: Calculates length, GC percentage, Wallace melting temperature ($T_m$), and flags potential synthesis issues.
- **Single & Batch Processing**: Run individual oligos or high-throughput batch arrays, multi-line FASTA, or delimited sequence lists.
- **Typed ESM Client**: Full TypeScript type definitions with Zod schema validation and Promise-based helper methods (`run`, `revcompSingle`, `revcompBatch`, `getManifest`, `getExamples`).
- **Command-Line Interface (CLI)**: Inspect manifests, list built-in examples, and execute reverse complement transformations directly from your shell.

# Installation

```bash
npm install pepkio-dna-revcomp-primer-toolkit
```

Requires Node.js 18 or newer.

# Configuration

Set an API key with **tools:run** scope before invoking `run()` or convenience methods:

```bash
export PEPKIO_API_KEY="your-api-key"
```

Create and manage keys in your [Pepkio Account](https://www.pepkio.com/account/api-keys).

Optional configuration variables:

| Variable | Purpose |
|----------|---------|
| `PEPKIO_API_KEY` | Production API key (required for `run`, `revcompSingle`, and `revcompBatch`) |
| `LOCAL_PEPKIO_API_KEY` | Local development key when `PEPKIO_API_BASE_URL` points to `tools.localtest.me` |
| `PEPKIO_API_BASE_URL` | API base URL (default: `https://tools.pepkio.com`) |

# Quick Example

```javascript
import { PepkioClient } from "pepkio-dna-revcomp-primer-toolkit";

const client = new PepkioClient();

// Run reverse complement on a single primer sequence
const response = await client.revcompSingle("ATGCGATCGATCGATC");

if (response.result?.single) {
  const { rev_complement, qc } = response.result.single;
  console.log("Reverse Complement:", rev_complement);
  console.log(`Length: ${qc.length_nt} nt, GC: ${qc.gc_percent}%, Tm: ${qc.tm_wallace_c} °C`);
}
```

# CLI

Inspect tool metadata and available examples:

```bash
npx pepkio-dna-revcomp-primer-toolkit manifest --examples
```

Execute a transformation run using a built-in example:

```bash
npx pepkio-dna-revcomp-primer-toolkit run --example single_gapdh_primer
```

# Typical Use Cases

- **Reverse Primer Design**: Generate antiparallel 5' to 3' reverse primers for standard PCR, RT-qPCR, and digital PCR.
- **Sanger Sequencing Orientation**: Flip reverse sequencing reads to align in the sense orientation with reference genomic templates.
- **IUPAC Degenerate Oligo Pools**: Calculate reverse complements for degenerate consensus primers used in microbial typing or broad-range pathogen detection.
- **Gibson & Golden Gate Assembly**: Construct complementary overhangs for multi-fragment seamless cloning vectors and inserts.
- **High-Throughput Batch QC**: Validate large primer plates and oligonucleotide lists against length, GC, and $T_m$ criteria prior to commercial synthesis ordering.

# Scientific Background

Nucleic acid sequences are synthesized and read in the 5' to 3' direction. During PCR, reverse primers must bind to the sense strand antiparallelly, meaning the primer sequence ordered from the vendor must represent the reverse complement of the target sense strand. For short oligonucleotides (14–20 nt), the Wallace rule ($T_m = 2(A+T) + 4(G+C)\ ^\circ\text{C}$) provides a fast estimation of duplex thermal stability under standard salt conditions.

# Web Application

For researchers who prefer a graphical interface, an interactive web version is available.

Web Application: https://www.pepkio.com/tools/dna-revcomp-primer-toolkit

The web application provides interactive sequence input, instant single and batch reverse complement calculations, IUPAC base resolution tables, inline primer QC metrics, and exportable CSV reports.

# Documentation and Resources

GitHub Repository: https://github.com/pepkio/pepkio-dna-revcomp-primer-toolkit-js

Web Application: https://www.pepkio.com/tools/dna-revcomp-primer-toolkit

Python client (PyPI): https://pypi.org/project/pepkio-dna-revcomp-primer-toolkit/

# About Pepkio

Pepkio (https://www.pepkio.com/) develops software tools and bioinformatics solutions for life science researchers, including laboratory calculators and analysis services (https://www.pepkio.com/cro).

A semantic, AI-native version of this document in the K2F format is available at https://k2f.dev (https://k2f.dev/v/90c3b575c89f7212b0904cce8aa8058040ea497c9cbd5d827e466e487a90ed4c)
