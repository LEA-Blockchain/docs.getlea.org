# @leachain/vm-shim

[![npm version](https://img.shields.io/npm/v/@leachain/vm-shim)](https://www.npmjs.com/package/@leachain/vm-shim)
[![GitHub license](https://img.shields.io/github/license/LEA-Blockchain/vm-shim)](https://github.com/LEA-Blockchain/vm-shim/blob/main/LICENSE)

@leachain/vm-shim is a reusable VM shim for Lea-chain WebAssembly modules, providing the necessary host environment for running smart contracts compatibly in both Node.js and browser environments.

## Features

-   **Environment-Agnostic**: Works seamlessly in both Node.js and modern web browsers.
-   **Secure by Default**: Provides a sandboxed environment with no filesystem or network access unless explicitly passed in.
-   **Configurable**: Allows custom handlers for events like `abort`.
-   **Typed API**: Includes TypeScript definitions for a better developer experience.
-   **Modern Tooling**: Bundled with `esbuild` for optimized, multi-format output (ESM, CJS, and IIFE).

## Installation

```sh
npm install @leachain/vm-shim
```

## Usage

The primary export is `createShim`, which generates the `importObject` for a WebAssembly instance.

### ES Modules (ESM)

This is the recommended approach for modern Node.js and browser bundlers.

```javascript
import { promises as fs } from 'fs';
import { createShim } from '@leachain/vm-shim';

async function runWasm() {
    // 1. Create the shim instance
    const { importObject, bindInstance } = createShim();

    // 2. Read your Wasm module bytes
    const wasmBytes = await fs.readFile('./path/to/your_contract.wasm');

    // 3. Instantiate the module with the shim's import object
    const { instance } = await WebAssembly.instantiate(wasmBytes, importObject);

    // 4. IMPORTANT: Bind the created instance to the shim
    // This allows host functions to access the Wasm module's memory.
    bindInstance(instance);

    // 5. Call an exported function from your Wasm module
    const result = instance.exports.your_function(123);
    console.log(`Wasm function returned: ${result}`);
}

runWasm().catch(console.error);
```

### CommonJS (CJS)

For older Node.js environments, you can use `require`.

```javascript
const { promises: fs } = require('fs');
const { createShim } = require('@leachain/vm-shim');

async function runWasm() {
    // 1. Create the shim instance
    const { importObject, bindInstance } = createShim();

    // 2. Read your Wasm module bytes
    const wasmBytes = await fs.readFile('./path/to/your_contract.wasm');

    // 3. Instantiate the module with the shim's import object
    const { instance } = await WebAssembly.instantiate(wasmBytes, importObject);

    // 4. IMPORTANT: Bind the created instance to the shim
    bindInstance(instance);

    // 5. Call an exported function from your Wasm module
    const result = instance.exports.your_function(123);
    console.log(`Wasm function returned: ${result}`);
}

runWasm().catch(console.error);
```

## API Reference

### `createShim(config?)`

-   `config` `<object>` (Optional)
    -   `onAbort` `<(message: string) => void>`: A custom handler to call when the Wasm module aborts. Defaults to `process.exit(1)` in Node.js and throws an `Error` in the browser.
-   **Returns** `<object>`
    -   `importObject` `<object>`: The WebAssembly import object. Pass this to `WebAssembly.instantiate`.
    -   `bindInstance` `<(instance: WebAssembly.Instance) => void>`: A function to bind the newly created Wasm instance to the shim. **This must be called after instantiation.**
    -   `print` `<object>`: A colored logging utility with `red`, `orange`, `green`, and `blue` methods.

### `cstring(memory, ptr)`

A utility function to read a null-terminated UTF-8 string from the Wasm instance's memory.

-   `memory` `<WebAssembly.Memory>`: The exported memory from your Wasm instance (`instance.exports.memory`).
-   `ptr` `<number>`: The pointer (memory address) of the string.
-   **Returns** `<string>`: The decoded string.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any bugs, features, or improvements.

## License

This project is licensed under the ISC License.