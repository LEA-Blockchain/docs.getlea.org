---
title: Lea Standard Library (`stdlea`)
---

# Lea Standard Library (`stdlea`)

The official standard library for developing secure and high-performance smart contracts on the Lea platform. It provides a minimal, WASM-first set of C functions and macros, designed to be lightweight, efficient, and secure by default.

`stdlea` replaces the standard C library with a custom implementation tailored for the WebAssembly environment, focusing on memory safety and performance.

## Features

*   **WASM Integration:** Macros (`LEA_EXPORT`, `LEA_IMPORT`) for seamless interaction with the host environment.
*   **Memory Management:** A simple and efficient bump allocator (`malloc`, `allocator_reset`). `free()` is disabled to prevent memory management errors.
*   **Memory Safety:** Functions like `memset`, `memcpy`, and `memmove` for safe memory manipulation.
*   **String Handling:** A core set of string functions (`strlen`, `strcmp`, `strcpy`, etc.).
*   **Optional Formatting:** Opt-in string formatting (`printf`, `snprintf`) and logging (`lea_log`) that can be enabled for development and disabled for production to reduce binary size.
*   **Security Hardening:** An optional Undefined Behavior Sanitizer (`UBSan`) to catch common programming errors at runtime.
*   **Simplified Build System:** A `stdlea.mk` file that can be included in your project's Makefile to handle all compiler flags and dependencies automatically.

## Getting Started: Integrating `stdlea`

To use `stdlea` in your project, you include the `stdlea.mk` file in your `makefile`. This handles all the necessary compiler flags and source file includes.

### Example Makefile for a Smart Contract

Here is an example of a `makefile` for a simple `ed25519.wasm` smart contract that uses `stdlea`:

```makefile
# --- Configuration ---
# Enable or disable optional stdlea features.
# Set to 1 to enable, 0 to disable.
ENABLE_UBSEN := 0
ENABLE_LEA_LOG := 0
ENABLE_LEA_FMT := 0

# --- Includes ---
# Include the stdlea makefile.
# Adjust the path based on your project structure.
include ../stdlea/stdlea.mk

# --- Compiler Flags ---
# Add any additional project-specific flags.
CFLAGS += -O3

# --- Include Paths ---
INCLUDE_PATHS := -I. -Isrc -Isrc/optional

# --- Header Files ---
ED25519_HDRS = src/monocypher.h src/optional/monocypher-ed25519.h randombytes.h
HDRS += $(ED25519_HDRS)

# --- Source Files ---
ED25519_SRCS = ed25519.c src/monocypher.c src/optional/monocypher-ed25519.c
SRCS += $(ED25519_SRCS)

# --- Target ---
TARGET := ed25519.wasm

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(SRCS) $(HDRS)
	@echo "Compiling and linking sources to $(TARGET)..."
	$(CC) $(CFLAGS) $(INCLUDE_PATHS) \
	$(SRCS) -o $@
	@echo "Stripping custom sections..."
	wasm-strip $@

clean:
	@echo "Removing build artifacts..."
	rm -f $(TARGET) *.o
```

## Build Configuration (`stdlea.mk`)

The `stdlea.mk` file provides several variables to control the build:

| Variable           | Description                                                                                                             | Default |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------- |
| `ENABLE_LEA_LOG`   | Enables the `lea_log()` function for printing messages to the host.                                                     | `0`     |
| `ENABLE_LEA_FMT`   | Enables the `printf()` and `snprintf()` functions for string formatting.                                                  | `0`     |
| `ENABLE_UBSEN`     | Enables the Undefined Behavior Sanitizer (UBSan) for runtime checks. This increases binary size and impacts performance. | `0`     |

## API Reference

### `stdlea.h`

Core macros and functions for interacting with the Lea environment.

| Function/Macro                        | Description                                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `LEA_EXPORT(FUNC_NAME)`               | Exports a function from the Wasm module, making it callable by the host.                                                               |
| `LEA_IMPORT(PROGRAM_ID, FUNC_NAME)`   | Imports a function from another module, allowing cross-contract calls.                                                                 |
| `LEA_ABORT()`                         | Immediately aborts execution and traps. Used for unrecoverable errors.                                                                 |
| `LEA_LOG(const char *msg)`            | Logs a message to the host. Only available if `ENABLE_LEA_LOG` is `1`.                                                                 |
| `allocator_reset()`                   | Resets the heap bump allocator, clearing all previously allocated memory.                                                              |
| `LEA_HEAP_SIZE`                       | Defines the total size of the static heap (default: 1 MiB).                                                                            |

### `stdlib.h`

Memory allocation and standard utilities.

| Function/Macro | Description                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `void *malloc(size_t size)` | Allocates `size` bytes from the heap using a bump allocator.                                                                   |
| `abort()`      | Aborts program execution by causing a trap.                                                                                            |
| `free(void *p)` | **Not available.** `stdlea` uses a bump allocator. Calling `free()` will intentionally cause a compile-time error. Use `allocator_reset()` instead. |

### `string.h`

Functions for memory and string manipulation.

| Function                                      | Description                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| `void *memset(void *dest, int val, size_t len)` | Fills a block of memory with a value.                                       |
| `void *memcpy(void *dest, const void *src, size_t len)` | Copies a block of memory. Does not handle overlapping memory.               |
| `void *memmove(void *dest, const void *src, size_t len)` | Copies a block of memory. Handles overlapping memory correctly.             |
| `int memcmp(const void *s1, const void *s2, size_t n)` | Compares two blocks of memory.                                              |
| `size_t strlen(const char *s)`                | Calculates the length of a null-terminated string.                          |
| `int strcmp(const char *s1, const char *s2)`  | Compares two null-terminated strings.                                       |
| `int strncmp(const char *s1, const char *s2, size_t n)` | Compares up to `n` characters of two strings.                               |
| `char *strcpy(char *dest, const char *src)`   | Copies a null-terminated string.                                            |
| `size_t strnlen(const char *s, size_t maxlen)` | Calculates the length of a string up to a maximum size.                     |

### `stdio.h`

Formatted output functions. These are only available if `ENABLE_LEA_FMT` is set to `1`.

| Function                                      | Description                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| `printf(const char *fmt, ...)`                | Prints a formatted string to the host environment.                          |
| `snprintf(char *buf, size_t size, const char *fmt, ...)` | Writes a formatted string to a buffer. See format specifiers below.         |
| `vsnprintf(char *buf, size_t size, const char *fmt, va_list args)` | Core implementation of `snprintf` that uses a `va_list`.                    |

#### Format Specifiers

The `printf` and `snprintf` functions in `stdlea` support a subset of the standard C specifiers, plus some custom additions designed for smart contract development.

**Standard Specifiers**

| Specifier | Output |
|---|---|
| `%d`, `%i` | Signed decimal integer. |
| `%u` | Unsigned decimal integer. |
| `%x` | Unsigned hexadecimal integer (lowercase). |
| `%b` | Unsigned binary integer (**custom extension**). |
| `%s` | Null-terminated string. A `NULL` pointer is printed as `(null)`. |
| `%c` | Single character. |
| `%%` | A literal `%` character. |

**Length Modifiers**

| Modifier | Type |
|---|---|
| `h` | `short` or `unsigned short` |
| `hh` | `signed char` or `unsigned char` |
| `ll` | `long long` or `unsigned long long` |

**Arbitrary-Length Specifiers (Custom)**

These non-standard specifiers are powerful tools for handling raw data. Each consumes two arguments from the stack: a `size_t` length, followed by a pointer.

| Specifier | Description | Arguments |
|---|---|---|
| `%*x` | Hex blob | `(size_t, const unsigned char*)` |
| `%*b` | Binary blob | `(size_t, const unsigned char*)` |
| `%*s` | Sized string (can be used for non-null-terminated strings) | `(size_t, const char*)` |

#### Examples

**1. Basic Formatting**

```c
char buffer[128];
int value = -42;
const char* name = "world";
snprintf(buffer, sizeof(buffer), "Hello, %s! The value is %d.", name, value);
// buffer now contains: "Hello, world! The value is -42."
```

**2. Hex and Binary Formatting**

The custom `%b` specifier is useful for viewing flags or raw binary data.

```c
char buffer[128];
unsigned int flags = 42; // 00101010 in binary
snprintf(buffer, sizeof(buffer), "Hex: %x, Binary: %b", flags, flags);
// buffer now contains: "Hex: 2a, Binary: 101010"
```

**3. Arbitrary-Length Hex Blob**

The `%*x` specifier is ideal for printing transaction hashes, public keys, or other fixed-size byte arrays.

```c
char buffer[128];
unsigned char tx_hash[4] = {0xDE, 0xAD, 0xBE, 0xEF};
snprintf(buffer, sizeof(buffer), "Transaction ID: %*x", sizeof(tx_hash), tx_hash);
// buffer now contains: "Transaction ID: deadbeef"
```

## Author

Developed by Allwin Ketnawang.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
