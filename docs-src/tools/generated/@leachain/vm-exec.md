[![npm version](https://img.shields.io/npm/v/@leachain/vm-exec)](https://www.npmjs.com/package/@leachain/vm-exec)
[![GitHub license](https://img.shields.io/github/license/LEA-Blockchain/vm-exec)](https://github.com/LEA-Blockchain/vm-exec/blob/main/LICENSE)

# `lea-vm-exec` Command-Line Usage

This guide provides detailed instructions for using the `lea-vm-exec` command-line tool to execute smart contracts in the Lea-chain VM shim.

## Installation

For one-off commands, you can use `npx` without any installation:

```sh
npx @leachain/vm-exec <path/to/module.wasm> <entry_point> [flag] [value]
```

Alternatively, you can install it globally to use the `lea-vm-exec` command directly:

```sh
npm install -g @leachain/vm-exec
lea-vm-exec <path/to/module.wasm> <entry_point> [flag] [value]
```

---

## Command Reference

The `lea-vm-exec` tool executes a WebAssembly smart contract by specifying the module path and an entry point function.

### `exec`

Executes a function within a WebAssembly module, passing arguments as specified by the flags.

#### Synopsis

```sh
lea-vm-exec <path/to/module.wasm> <entry_point> [options]
```

-   `<path/to/module.wasm>`: The path to the WebAssembly module to execute.
-   `<entry_point>`: The name of the exported function to call.

#### Options

-   `--string <value>`: Pass a string to the entry point. The string is encoded and written into the Wasm memory.
-   `--number <value>`: Pass a number to the entry point.
-   `--file <path>`: Pass the contents of a file to the entry point. The file content is read as bytes and written into the Wasm memory.

#### Examples

**1. Execute with a string argument**

**Command:**
```sh
npx @leachain/vm-exec ./contract.wasm run_test --string "hello world"
```

**Output:**
```
[INFO] Successfully instantiated wasm module. Entry point 'run_test' found.

[INFO] Argument is a string.

[INFO] Copied string content to wasm memory at address 1048816 (size: 11).

[INFO] Calling entry point with (pointer, size).

[INFO] Entry point returned exit code: 0
```

**2. Execute with a file as an argument**

**Command:**
```sh
npx @leachain/vm-exec ./contract.wasm process_data --file ./data.json
```

**Output:**
```
[INFO] Successfully instantiated wasm module. Entry point 'process_data' found.

[INFO] Argument is a file ('./data.json'). Reading content.

[INFO] Copied file content to wasm memory at address 1048816 (size: 256).

[INFO] Calling entry point with (pointer, size).

[INFO] Entry point returned exit code: 0
```
---
## Metadata

-   **Name**: `lea-vm-exec`
-   **Version**: `1.0.0`
-   **Description**: A CLI for executing LEA VM smart contracts via the VM shim.
-   **Category**: Virtual Machine
-   **Repository**: `https://github.com/LEA-Blockchain/vm-exec.git`