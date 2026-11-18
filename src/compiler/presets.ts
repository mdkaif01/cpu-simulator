// Preset Programs for the Computer Simulator (Standard C & High-Level Syntax)

export interface CodePreset {
  id: string;
  name: string;
  category: 'C Basics' | 'Control Flow' | 'Algorithms' | 'Hardware/ALU';
  description: string;
  code: string;
}

export const PRESETS: CodePreset[] = [
  {
    id: 'variables-math',
    name: '1. C Math & Variables (Basics)',
    category: 'C Basics',
    description: 'Learn how C variables are mapped to RAM addresses and how the ALU computes arithmetic.',
    code: `// --- 1. C Variables & Arithmetic ---
// Watch data transfer between RAM, Registers, and ALU
#include <stdio.h>

int main() {
    int a = 15;
    int b = 7;

    int sum = a + b;
    int diff = a - b;
    int product = a * 2;

    printf("Sum: %d\\n", sum);
    printf("Diff: %d\\n", diff);
    printf("Product: %d\\n", product);

    return 0;
}
`
  },
  {
    id: 'if-else-max',
    name: '2. C Conditionals (If / Else)',
    category: 'Control Flow',
    description: 'See how the ALU compares two numbers and how the FLAGS register (Zero/Negative) directs CPU branching.',
    code: `// --- 2. C Conditionals & Branching ---
// Compares two numbers and uses condition flags (Z, N) to branch
#include <stdio.h>

int main() {
    int x = 42;
    int y = 73;
    int max = 0;

    if (x > y) {
        max = x;
    } else {
        max = y;
    }

    printf("Maximum: %d\\n", max);
    return 0;
}
`
  },
  {
    id: 'loop-sum',
    name: '3. C For Loop (Sum 1 to 5)',
    category: 'Control Flow',
    description: 'Watch the Program Counter (PC) loop backward and watch registers accumulate values on each cycle.',
    code: `// --- 3. C For Loop Accumulator ---
// Computes 1 + 2 + 3 + 4 + 5 = 15
#include <stdio.h>

int main() {
    int total = 0;

    for (int i = 1; i <= 5; i++) {
        total += i;
        printf("Current sum: %d\\n", total);
    }

    return 0;
}
`
  },
  {
    id: 'fibonacci',
    name: '4. C Fibonacci Sequence',
    category: 'Algorithms',
    description: 'Computes Fibonacci numbers step by step, swapping variables through temporary storage in RAM.',
    code: `// --- 4. C Fibonacci Sequence ---
// Generates first 7 numbers: 0, 1, 1, 2, 3, 5, 8
#include <stdio.h>

int main() {
    int a = 0;
    int b = 1;
    int n = 7;

    for (int i = 0; i < n; i++) {
        printf("%d\\n", a);
        int next = a + b;
        a = b;
        b = next;
    }

    return 0;
}
`
  },
  {
    id: 'function-call',
    name: '5. C Functions & Stack Frame',
    category: 'Algorithms',
    description: 'Inspect the Call Stack and Stack Pointer (SP) as a function is invoked, executes, and returns.',
    code: `// --- 5. C Functions & Call Stack ---
// Demonstrates stack frames, parameter passing, and return
#include <stdio.h>

int square(int n) {
    int result = n * n;
    return result;
}

int main() {
    int num = 6;
    int ans = square(num);
    printf("Result: %d\\n", ans);
    return 0;
}
`
  },
  {
    id: 'array-sum',
    name: '6. C Array Memory Traversal',
    category: 'Algorithms',
    description: 'Observe contiguous memory allocation in the Data segment and indexed pointer dereferencing.',
    code: `// --- 6. C Memory Array Traversal ---
// Allocates contiguous array in RAM and sums its elements
#include <stdio.h>

int main() {
    int numbers[4] = {10, 20, 30, 40};
    int sum = 0;

    for (int i = 0; i < 4; i++) {
        sum += numbers[i];
    }

    printf("Total sum: %d\\n", sum);
    return 0;
}
`
  },
  {
    id: 'bitwise-logic',
    name: '7. C Bitwise Logic & Shifts',
    category: 'Hardware/ALU',
    description: 'Directly exercises ALU logic gates: AND, OR, XOR, and bitwise Left/Right shifts.',
    code: `// --- 7. C Bitwise Operations ---
// Tests internal logic gates inside the ALU
#include <stdio.h>

int main() {
    int val = 12;      // Binary: 0000 1100
    int mask = 7;      // Binary: 0000 0111

    int bitAnd = val & mask;  // 4 (0100)
    int bitOr  = val | mask;  // 15 (1111)
    int bitXor = val ^ mask;  // 11 (1011)
    int shifted = val << 2;   // 48 (val * 4)

    printf("%d\\n", bitAnd);
    printf("%d\\n", bitOr);
    printf("%d\\n", bitXor);
    printf("%d\\n", shifted);

    return 0;
}
`
  }
];
