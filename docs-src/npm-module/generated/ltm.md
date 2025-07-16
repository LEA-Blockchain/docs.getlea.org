# ltm

Node.js module for programmatically building and decoding Lea Chain Transaction Manifests.

# LTM Module Usage

This guide provides detailed instructions and examples for using the `ltm` package as a Node.js module.

## Installation

Install the package using npm:

```sh
npm install @leachain/ltm
```

---

## Core Functions

The module exports two primary asynchronous functions: `build` and `decode`.

```javascript
import { build, decode } from '@leachain/ltm';
```

---

### 1. `build(ltmObject)`

Programmatically constructs and signs a binary transaction from a JavaScript object.

-   **Parameter**: `ltmObject` (Object) - A JavaScript object that follows the LTM schema. Note: The `outputFile` field is ignored by this function.
-   **Returns**: A `Promise` that resolves to a `Uint8Array` containing the raw binary transaction data.

#### Important Note on Browser Usage

The `build` function has limitations in a browser environment. Specifically, any LTM feature that requires file system access or command execution will not work. This includes:
-   The `signers` object (which reads key files).
-   The `$file()`, `$json()`, and `$exec()` placeholders.

If these features are used in a browser context, the function will throw an error. To build transactions in a browser, you must provide all data, including key material, directly within the `ltmObject`.

#### Example: Building a Transaction in Node.js

This example demonstrates building a transaction by providing the keyset directly as a JavaScript array.

```javascript
import { build } from '@leachain/ltm';
import fs from 'fs/promises';

async function createTransaction() {
    // Load your keyset from a file or secure storage
    const keysetJson = await fs.readFile('./main-keyset.json', 'utf8');
    const myKeyset = JSON.parse(keysetJson);

    // Define the transaction in a JavaScript object
    const myTransaction = {
        feePayer: 'main',
        sequence: 1,
        gasLimit: 1000000,
        gasPrice: 1,
        signers: {
            main: myKeyset // Provide the keyset array directly
        },
        invocations: [
            {
                targetAddress: '$signer(main.address)',
                instructions: [
                    { "uint64": "9876543210" },
                    { "vector": Buffer.from("hello world").toString('hex') }
                ]
            }
        ]
    };

    try {
        console.log('[INFO] Building transaction...');
        const binaryTx = await build(myTransaction);

        // Save the binary transaction to a file
        const outputPath = './my-transaction.bin';
        await fs.writeFile(outputPath, binaryTx);
        console.log(`[PASS] Transaction built and saved to ${outputPath} (${binaryTx.byteLength} bytes)`);
        
        return binaryTx;
    } catch (error) {
        console.error(`[FAIL] Failed to build transaction: ${error.message}`);
    }
}

createTransaction();
```

---

### 2. `decode(binaryData)`

Decodes a binary transaction into a human-readable JavaScript object. This function is universal and works the same in both Node.js and browser environments.

-   **Parameter**: `binaryData` (Buffer | Uint8Array) - The binary transaction data to decode.
-   **Returns**: A `Promise` that resolves to a JavaScript object representing the transaction.

#### Example: Decoding a Transaction

This example reads a binary transaction file and prints its decoded contents.

```javascript
import { decode } from 'ltm';
import fs from 'fs/promises';

async function inspectTransaction(filePath) {
    try {
        console.log(`[INFO] Reading binary transaction from: ${filePath}`);
        const binaryData = await fs.readFile(filePath);

        console.log('[INFO] Decoding transaction...');
        const decodedTx = await decode(binaryData);

        console.log('[PASS] Transaction decoded successfully:');
        console.log(JSON.stringify(decodedTx, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value, 2));
        
        return decodedTx;
    } catch (error) {
        console.error(`[FAIL] Failed to decode transaction: ${error.message}`);
    }
}

inspectTransaction('./my-transaction.bin');
```

---