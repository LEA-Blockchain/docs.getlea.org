---
title: SCTP Library API Reference
---

# SCTP Library API Reference

## Introduction

The Simple Compact Transaction Protocol (SCTP) library provides a highly efficient and straightforward binary serialization format, based on the [LIP-0006](https://docs.getlea.org/lips/LIP-0006.html). It is designed for performance and ease of use, especially in resource-constrained environments like WebAssembly.

The library allows you to encode a sequence of typed data fields into a compact byte stream and then decode that stream back into its original data structures. It is written in C and exposes a simple, clean API for both encoding and decoding operations.

## Core Concepts

### Encoding Model

The encoder uses a **global singleton** design. You initialize it once, add all your data fields sequentially, and then retrieve the final byte buffer. This model simplifies the process of creating a data stream, as you do not need to manage encoder instances.

### Decoding Models

The library offers two distinct models for decoding a byte stream, allowing you to choose the best fit for your application's architecture.

1.  **Stateful Iteration (Pull-style):** This is an instance-based approach where you create a decoder for a specific data buffer. You then call `sctp_decoder_next()` in a loop to "pull" data fields one by one. After each call, the decoder instance is updated with the type, value, and size of the decoded field. This model gives the caller full control over the decoding loop.

2.  **Callback-Based (Push-style):** This model is ideal for WebAssembly or event-driven systems. You provide a handler function, and the decoder parses the entire stream, "pushing" each decoded field to your callback as it's found. This is driven by a single call to `sctp_decoder_run()`.

### Wire Format

SCTP uses a well-defined binary format where each data field is prefixed with a 1-byte header that specifies its type and metadata. All multi-byte integers and floats are encoded in little-endian byte order. For complete details on the binary layout, see the [SCTP Encoding Specification](./sctp_encoding.md).

---

## Getting Started: A Complete Example

This example demonstrates the full lifecycle of encoding data and then decoding it using the **Stateful Iteration** model.

```c
#include "sctp.h"
#include <stdio.h>
#include <string.h>
#include <assert.h>

int main() {
    // --- 1. Encoding Phase ---
    printf("Encoding data...\n");
    sctp_encoder_init(256); // Initialize with a 256-byte buffer

    // Add various data types
    sctp_encoder_add_uint32(12345);
    sctp_encoder_add_short(10); // A small integer (0-15)

    const char* message = "hello world";
    void* vec_ptr = sctp_encoder_add_vector(strlen(message));
    memcpy(vec_ptr, message, strlen(message));

    sctp_encoder_add_eof(); // Mark the end of the stream

    // Retrieve the encoded data
    const uint8_t* encoded_data = sctp_encoder_data();
    size_t encoded_size = sctp_encoder_size();
    printf("Encoding complete. Total size: %zu bytes.\n\n", encoded_size);


    // --- 2. Decoding Phase ---
    printf("Decoding data using stateful iteration...\n");
    sctp_decoder_t* dec = sctp_decoder_from_buffer(encoded_data, encoded_size);
    assert(dec != NULL);

    // Loop until EOF is reached
    while (sctp_decoder_next(dec) != SCTP_TYPE_EOF) {
        switch (dec->last_type) {
            case SCTP_TYPE_UINT32:
                printf("Decoded UINT32: %u\n", dec->last_value.as_uint32);
                assert(dec->last_value.as_uint32 == 12345);
                break;
            case SCTP_TYPE_SHORT:
                printf("Decoded SHORT: %u\n", dec->last_value.as_short);
                assert(dec->last_value.as_short == 10);
                break;
            case SCTP_TYPE_VECTOR:
                printf("Decoded VECTOR: \"%.*s\"\n", (int)dec->last_size, (const char*)dec->last_value.as_ptr);
                assert(strncmp((const char*)dec->last_value.as_ptr, message, dec->last_size) == 0);
                break;
            default:
                printf("Decoded an unexpected type: %d\n", dec->last_type);
                break;
        }
    }

    printf("Decoding complete.\n");

    // --- 3. Cleanup ---
    sctp_decoder_free(dec);

    return 0;
}
```

---

## Public Data Types

These are the core data structures you will interact with when using the SCTP library.

### `sctp_type_t`

An enum that defines all possible data types in an SCTP stream.

```c
typedef enum {
    SCTP_TYPE_INT8 = 0,
    SCTP_TYPE_UINT8 = 1,
    SCTP_TYPE_INT16 = 2,
    SCTP_TYPE_UINT16 = 3,
    SCTP_TYPE_INT32 = 4,
    SCTP_TYPE_UINT32 = 5,
    SCTP_TYPE_INT64 = 6,
    SCTP_TYPE_UINT64 = 7,
    SCTP_TYPE_ULEB128 = 8,
    SCTP_TYPE_SLEB128 = 9,
    SCTP_TYPE_FLOAT32 = 10,
    SCTP_TYPE_FLOAT64 = 11,
    SCTP_TYPE_SHORT = 12,
    SCTP_TYPE_VECTOR = 13,
    // Value 14 is reserved
    SCTP_TYPE_EOF = 15
} sctp_type_t;
```

### `sctp_value_t`

A union that holds the value of a decoded field. You must access the correct member based on the field's `sctp_type_t`.

```c
typedef union {
    int8_t   as_int8;
    uint8_t  as_uint8;
    int16_t  as_int16;
    uint16_t as_uint16;
    int32_t  as_int32;
    uint32_t as_uint32;
    int64_t  as_int64;
    uint64_t as_uint64;
    uint64_t as_uleb128;
    int64_t  as_sleb128;
    float    as_float32;
    double   as_float64;
    uint8_t  as_short;
    const void* as_ptr; // For SCTP_TYPE_VECTOR
} sctp_value_t;
```

### `sctp_decoder_t`

A struct that holds the complete state of a decoder instance. When using the stateful iteration model, you will primarily access its public fields to get information about the last decoded item.

```c
typedef struct sctp_decoder {
    const uint8_t* data;     // Pointer to the input data buffer.
    size_t size;             // Total size of the data buffer.
    size_t position;         // Current read offset in the buffer.
    sctp_type_t last_type;   // Type of the last decoded item.
    sctp_value_t last_value; // Value of the last decoded item.
    size_t last_size;        // Size of the last decoded item (especially for vectors).
    // ... private fields
} sctp_decoder_t;
```

---

## Usage in WebAssembly

The library is designed to integrate seamlessly with WebAssembly hosts. The primary integration point is the callback-based decoder.

### Compiler Defines

When compiling the library for a Wasm environment that uses the callback model, you must define `SCTP_HANDLER_PROVIDED`.

-   **`SCTP_HANDLER_PROVIDED`**: This preprocessor macro signals that the host environment (e.g., JavaScript) will provide the implementation for the data handler callback. This prevents the default (dummy) implementation from being compiled.

### The Data Handler Callback

The host environment **must** implement and export a function with the following signature. The SCTP decoder will call this function for every data field it successfully parses from the stream.

```c
/**
 * @brief The user-defined callback function to handle decoded data.
 *
 * @param type The sctp_type_t of the field found.
 * @param data A pointer to the decoded data in the Wasm module's memory.
 * @param size The size of the data in bytes.
 */
void __sctp_data_handler(sctp_type_t type, const void* data, size_t size);
```

---

## Encoder API Reference

The encoder operates on a global internal state.

### `sctp_encoder_init`

Initializes or resets the global encoder with a new buffer of a specified capacity.

```c
void sctp_encoder_init(size_t capacity);
```

-   **`capacity`**: The total size in bytes to allocate for the encoding buffer.

### `sctp_encoder_data`

Gets a read-only pointer to the start of the encoded data buffer.

```c
const uint8_t* sctp_encoder_data(void);
```

-   **Returns**: A `const` pointer to the byte buffer.

### `sctp_encoder_size`

Gets the current size (number of bytes written) of the encoded data.

```c
size_t sctp_encoder_size(void);
```

-   **Returns**: The number of bytes currently used in the buffer.

### `sctp_encoder_add_*` Functions

These functions append data of a specific type to the stream.

| Function Signature                      | Description                                       |
| --------------------------------------- | ------------------------------------------------- |
| `void sctp_encoder_add_int8(int8_t v)`   | Appends an 8-bit signed integer.                  |
| `void sctp_encoder_add_uint8(uint8_t v)` | Appends an 8-bit unsigned integer.                |
| `void sctp_encoder_add_int16(int16_t v)` | Appends a 16-bit signed integer.                  |
| `void sctp_encoder_add_uint16(uint16_t v)`| Appends a 16-bit unsigned integer.                |
| `void sctp_encoder_add_int32(int32_t v)` | Appends a 32-bit signed integer.                  |
| `void sctp_encoder_add_uint32(uint32_t v)`| Appends a 32-bit unsigned integer.                |
| `void sctp_encoder_add_int64(int64_t v)` | Appends a 64-bit signed integer.                  |
| `void sctp_encoder_add_uint64(uint64_t v)`| Appends a 64-bit unsigned integer.                |
| `void sctp_encoder_add_uleb128(uint64_t v)`| Appends a ULEB128-encoded integer.              |
| `void sctp_encoder_add_sleb128(int64_t v)`| Appends an SLEB128-encoded integer.             |
| `void sctp_encoder_add_float32(float v)` | Appends a 32-bit float.                           |
| `void sctp_encoder_add_float64(double v)`| Appends a 64-bit float (double).                  |
| `void sctp_encoder_add_eof(void)`        | Appends an End-Of-File marker.                    |

### `sctp_encoder_add_short`

Appends a small integer (0-15) to the stream, encoded in a single byte.

```c
void sctp_encoder_add_short(uint8_t value);
```

-   **`value`**: The integer to encode. **Must be <= 15**.

### `sctp_encoder_add_vector`

Appends a variable-length byte array to the stream.

```c
void* sctp_encoder_add_vector(size_t length);
```

-   **`length`**: The size of the vector in bytes.
-   **Returns**: A writable pointer to the allocated space in the buffer. The caller is responsible for writing `length` bytes to this location (e.g., using `memcpy`).

**Example:**
```c
const char* my_string = "data";
size_t len = strlen(my_string);
void* ptr = sctp_encoder_add_vector(len);
memcpy(ptr, my_string, len);
```

---

## Decoder API Reference

### Initialization and Cleanup

#### `sctp_decoder_from_buffer`

Creates a new decoder instance that reads from an existing, externally managed buffer.

```c
sctp_decoder_t* sctp_decoder_from_buffer(const void* buffer, size_t size);
```

-   **`buffer`**: A pointer to the data buffer to decode.
-   **`size`**: The size of the buffer in bytes.
-   **Returns**: A pointer to a new `sctp_decoder_t` instance, or `NULL` on failure.

#### `sctp_decoder_init`

Creates a new decoder instance and allocates a writable data buffer within the Wasm module's memory. This is primarily for hosts that need to write data into the module before decoding.

```c
sctp_decoder_t* sctp_decoder_init(size_t size);
```

-   **`size`**: The size of the data buffer to allocate.
-   **Returns**: A pointer to a new `sctp_decoder_t` instance, or `NULL` on failure.

#### `sctp_decoder_free`

Frees a decoder instance created by `sctp_decoder_from_buffer` or `sctp_decoder_init`.

```c
void sctp_decoder_free(sctp_decoder_t* dec);
```

-   **`dec`**: The decoder instance to free.

### Decoding Methods

#### Stateful Iteration

This model uses `sctp_decoder_next` to read one field at a time.

##### `sctp_decoder_next`

Decodes the next field from the stream and updates the decoder instance's `last_type`, `last_value`, and `last_size` fields.

```c
sctp_type_t sctp_decoder_next(sctp_decoder_t* dec);
```

-   **`dec`**: The decoder instance.
-   **Returns**: The `sctp_type_t` of the decoded field, or `SCTP_TYPE_EOF` when the end of the stream is reached.

**Example:**
```c
sctp_decoder_t* dec = sctp_decoder_from_buffer(data, size);
while (sctp_decoder_next(dec) != SCTP_TYPE_EOF) {
    if (dec->last_type == SCTP_TYPE_INT32) {
        // Process dec->last_value.as_int32
    }
}
sctp_decoder_free(dec);
```

#### Callback-Based

This model uses `sctp_decoder_run` to parse the entire stream and invoke a callback for each field.

##### `sctp_decoder_run`

Runs the decoder over the entire buffer, invoking the host-provided `__sctp_data_handler` for each field.

```c
int sctp_decoder_run(sctp_decoder_t* dec);
```

-   **`dec`**: The decoder instance.
-   **Returns**: `0` on success, non-zero on error.

**Example (Host-side C code):**
```c
// Host must provide this implementation
void __sctp_data_handler(sctp_type_t type, const void* data, size_t size) {
    if (type == SCTP_TYPE_UINT64) {
        uint64_t value = *(const uint64_t*)data;
        printf("Handler received UINT64: %llu\n", value);
    }
}

void run_callback_decoding(const uint8_t* data, size_t size) {
    // Define SCTP_HANDLER_PROVIDED when compiling the library
    sctp_decoder_t* dec = sctp_decoder_from_buffer(data, size);
    if (sctp_decoder_run(dec) != 0) {
        fprintf(stderr, "Decoding failed.\n");
    }
    sctp_decoder_free(dec);
}
```