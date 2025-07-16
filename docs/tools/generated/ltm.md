# ltm

Command-line interface for building and decoding Lea Chain Transaction Manifests.

# LTM Command-Line Usage

This guide provides detailed instructions for using the `ltm` command-line tool.

## Installation

For one-off commands, you can use `npx` without any installation:

```sh
npx @leachain/ltm <command>
```

Alternatively, you can install it globally to use the `ltm` command directly:

```sh
npm install -g @leachain/ltm
ltm <command>
```

---

## Commands

The CLI has two main commands: `build` and `decode`.

### 1. `build`

Constructs and signs a binary transaction from a JSON-based LTM file.

#### Synopsis

```sh
npx @leachain/ltm build <file_path>
```

-   `<file_path>`: The path to your LTM JSON file.

#### Description

The `build` command reads a specified LTM file, resolves all placeholders, assembles the transaction, and signs it.

If the `outputFile` field is present in the manifest, the binary data is written to that file. If `outputFile` is omitted, the raw binary data is written to standard output (`stdout`), allowing it to be piped to other tools.

#### Example 1: Writing to a File

If `my-transaction.json` contains an `outputFile` field, the output is saved to that file. This example also shows loading signers using placeholders.

```json
{
  "outputFile": "./my-transaction.bin",
  "feePayer": "main",
  "signers": {
    "main": "$file(./main-keyset.json)",
    "secondary": "$json(./all-my-secrets.json#wallets.secondary)"
  },
  ...
}
```

**Command Execution:**
```sh
npx @leachain/ltm build my-transaction.json
```

**Output (to stderr):**
```
[INFO] Reading LTM file: my-transaction.json
[INFO] Building transaction...
[PASS] Transaction successfully written to /path/to/project/my-transaction.bin (30001 bytes)
```

#### Example 2: Piping to Standard Output

If `stdout-transaction.json` omits the `outputFile` field, the output is piped to `stdout`.

```json
{
  "feePayer": "main",
  ...
}
```

**Command Execution:**
```sh
# Pipe the binary output to another command, like a tool that broadcasts it
npx @leachain/ltm build stdout-transaction.json | npx @leachain/ltm decode -
```

**Output (to stdout):**
The raw binary data of the transaction. (The example above shows it being piped to the `decode` command).

---

### 2. `decode`

Decodes a binary transaction into a human-readable JSON format.

#### Synopsis

```sh
npx @leachain/ltm decode <file_path | ->
```

-   `<file_path>`: The path to the binary transaction file. Use `-` to read from standard input (`stdin`).

#### Description

This command is the reverse of `build`. It reads a binary transaction from a file or standard input and writes the decoded JSON representation to standard output (`stdout`). It is useful for verifying the contents of a binary transaction before broadcasting it.

#### Example

**Command Execution:**

```sh
npx @leachain/ltm decode my-transaction.bin
```

**Output (example format):**

```json
{
  "version": 1,
  "sequence": 1,
  "gasLimit": 1000000,
  "gasPrice": 1,
  "addresses": [
    "a1b2c3..."
  ],
  "invocations": [
    {
      "targetIndex": 0,
      "instructions": "0c01..."
    }
  ],
  "signatures": [
    {
      "ed25519": "d4e5f6...",
      "sphincs": "g7h8i9..."
    }
  ]
}
```

---