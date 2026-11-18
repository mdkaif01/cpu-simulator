# SiliconSim — Interactive Computer Architecture & CPU Simulator

[![Deploy to GitHub Pages](https://github.com/mdkaif01/cpu-simulator/actions/workflows/deploy.yml/badge.svg)](https://github.com/mdkaif01/cpu-simulator/actions/workflows/deploy.yml)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

A web-based computer architecture simulator that visually illustrates how a Von Neumann computer executes code step-by-step. Write high-level C or scripting code and watch data transfer live between registers, the ALU, system buses, and memory.

---

### 🌐 Live Demo
👉 **[Launch SiliconSim](https://mdkaif01.github.io/cpu-simulator/)**

---

## 🌟 Key Features

### 1. High-Level Language & Compiler
- **Standard C & High-Level Syntax**:
  - Variable declarations & assignments: `int a = 15; int b = 7;`
  - Arithmetic & Expressions: `+`, `-`, `*`, `/`, `%`
  - Bitwise operations: `&`, `|`, `^`, `<<`, `>>`
  - Control Flow: `if / else`, `while`, and `for` loops
  - Functions & Call Frames: `int square(int n) { return n * n; }`
  - Arrays & Memory indexing: `int arr[4] = {10, 20, 30, 40};`
  - Standard output: `printf("Result: %d\n", ans);` or `print(x);`
- **Synchronized Source Mapping**:
  - The custom compiler generates instruction-to-source maps.
  - As machine instructions execute, both the active assembly line and the corresponding high-level source line highlight in real time.
- **Interactive Breakpoints**:
  - Click on any line number in the code editor gutter to set or clear execution breakpoints.

### 2. Micro-Architecture & CPU Datapath
- **Central Processing Unit (CPU)**:
  - **Register File**:
    - General Purpose: `R0`, `R1`, `R2`, `R3`, `R4`, `R5` with live values in Decimal, Hex, and Binary.
    - Special Registers:
      - `PC` (Program Counter)
      - `IR` (Instruction Register)
      - `SP` (Stack Pointer)
      - `BP` (Base Pointer)
      - `MAR` (Memory Address Register)
      - `MBR` (Memory Buffer Register / MDR)
  - **Arithmetic Logic Unit (ALU)**:
    - Trapezoid hardware visualizer displaying Operand A, Operand B, active operation, and Result.
    - Condition Status Flags:
      - `Z` (Zero Flag)
      - `N` (Negative Flag)
      - `C` (Carry Flag)
      - `V` (Overflow Flag)
  - **Control Unit (CU)**:
    - 4-Stage Micro-Cycle State Machine:
      1. `FETCH`: `MAR <- PC`, `MBR <- RAM[MAR]`, `IR <- MBR`, `PC <- PC + 1`
      2. `DECODE`: Interprets opcode and resolves operands
      3. `EXECUTE`: Computes via ALU or calculates branch target
      4. `WRITEBACK`: Commits result to Register or Memory
    - Visual indicators for hardware control lines (`MEM_RD`, `MEM_WR`, `ALU_EN`, `REG_LD`).
  - **Active Cycle Explanation**:
    - Plain-English card updating every clock cycle to explain exactly what hardware transfers just occurred.

### 3. Animated System Buses
- **Address Bus** (Golden/Amber): Transmits memory addresses from MAR/PC across the architecture.
- **Data Bus** (Cyan/Blue): Bidirectional transmission between RAM, MBR, Registers, and ALU with flowing packet animations.
- **Control Bus** (Purple): Carries read/write and synchronization pulses.

### 4. Execution Controls & Time Travel Debugging
- **Play / Pause**: Automated clock execution with speed slider from 0.5 Hz to 20 Hz.
- **Micro-Step (F11)**: Advance one micro-cycle at a time (Fetch $\rightarrow$ Decode $\rightarrow$ Execute $\rightarrow$ Writeback).
- **Instruction Step (F10)**: Advance one full machine instruction.
- **Line Step**: Advance one full line of high-level source code.
- **Step Back (Ctrl+Z)**: Reversible time-travel debugging — step backwards through execution history.
- **Reset (F8)**: Re-initialize CPU, registers, and memory back to cycle 0.

### 5. Built-in Preset Programs
1. **C Math & Variables (Basics)**: Data transfer between RAM, Registers, and arithmetic calculations.
2. **C Conditionals (If / Else)**: ALU comparison and branching using Condition Flags (`Z`, `N`).
3. **C For Loop (Sum 1 to 5)**: PC loop jumps and register accumulation.
4. **C Fibonacci Sequence**: Variables swap in memory to generate Fibonacci numbers.
5. **C Functions & Stack Frame**: Function calls, parameter passing, and return values.
6. **C Array Memory Traversal**: Contiguous memory access and indexed dereferencing.
7. **C Bitwise Logic & Shifts**: Bitwise AND, OR, XOR, and bit-shift ALU operations.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle Run / Pause |
| `F11` | Micro-Cycle Step (Fetch $\rightarrow$ Decode $\rightarrow$ Execute $\rightarrow$ Writeback) |
| `F10` | Full Instruction Step |
| `Line Step` | Step to Next Source Code Line |
| `Ctrl + Z` | Step Back (Undo / Time Travel) |
| `F8` | Reset CPU to Cycle 0 |

---

## 🛠️ Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- `npm`

### Installation & Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/mdkaif01/cpu-simulator.git
   cd cpu-simulator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

### Building for Production

```bash
npm run build
npm run preview
```

---

## 🚀 Deployment

The project is configured for automated deployment to **GitHub Pages** using GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). Every push to the `main` branch automatically builds and publishes the latest version.
