# lea-keygen

A CLI tool for generating and managing Lea Chain keysets.

# `lea-keygen` Command-Line Usage

This guide provides detailed instructions for using the `lea-keygen` command-line tool to generate Lea Chain keysets.

## Installation

For one-off commands, you can use `npx` without any installation:

```sh
npx @leachain/keygen <command>
```

Alternatively, you can install it globally to use the `lea-keygen` command directly:

```sh
npm install -g @leachain/keygen
lea-keygen <command>
```

---

## Commands

The `lea-keygen` tool supports two main commands: `new` and `verify`.

### `new` Command

Generates a new keyset.

#### Synopsis

```sh
lea-keygen new [options]
```

#### Options

-   `--no-outfile`: Prints the generated keyset to standard output (`stdout`) as a JSON array instead of saving it to a file.
-   `--outfile <path>`: Specifies a custom file path to save the keyset. If this is not provided, the keyset is saved to `<address>.json` in the current directory.
-   `--force`: If a keyset file already exists at the target path, this flag allows overwriting it. Without this flag, the tool will exit with an error to prevent accidental data loss.

#### Examples

##### 1. Generate a Keyset and Save to a File

This is the default behavior. It generates a new keyset and saves it to a file named after the derived public address.

**Command:**
```sh
npx @leachain/keygen new
```

**Output (to stderr):**
```
Public Address: lea1q...
Keyset saved to: /path/to/project/lea1q....json
```

The resulting file will contain the full keyset with secure file permissions (`600`).

##### 2. Generate a Keyset and Print to Console

Use the `--no-outfile` flag to prevent writing to a file and instead print the keyset to `stdout`.

**Command:**
```sh
npx @leachain/keygen new --no-outfile
```

**Output (to stdout):**
```json
[
  [10, 20, 30, ...],
  [
    [10, 20, 30, ...],
    [10, 20, 30, ...]
  ]
]
```
**Output (to stderr):**
```
Public Address: lea1q...
Keyset generated to stdout.
```

---

### `verify` Command

Displays the public address for a given keyset file.

#### Synopsis

```sh
lea-keygen verify <file_path>
```

-   `<file_path>`: The path to the keyset JSON file.

#### Description

This command reads a keyset file, derives the public address from it, and prints the address to standard output. This is useful for verifying the address of a wallet without needing to generate a new key.

#### Example

**Command:**
```sh
npx @leachain/keygen verify ./my-keys/main-wallet.json
```

**Output (to stdout):**
```
lea1q...
```

---