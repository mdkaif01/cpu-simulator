# SiliconSim — Interactive Computer Architecture & CPU Simulator

A web-based simulator that visually illustrates how a computer works internally. Write high-level language code and watch step-by-step execution across registers, the ALU, system buses, and memory.

---

## 🚀 Quick Start (How to Run)

The development server is already running! You can open your browser to:

👉 **[http://localhost:5173/](http://localhost:5173/)**

### Running Manually

If you restart your terminal or want to run it from scratch:

```bash
cd F:\Antigravity\cpu-simulator
npm run dev
```

Then open `http://localhost:5173` in your browser.

To build a production-ready static site:
```bash
npm run build
npm run preview
```

---

## 🌟 Key Features

### 1. High-Level Language & Compiler
- **Intuitive C/JS-like Syntax**:
  - Variable declarations & assignments: `let a = 15; let b = 7;`
  - Expressions & Math: `+`, `-`, `*`, `/`, `%`
  - Bitwise operations: `&`, `|`, `^`, `<<`, `>>`
  - Control Flow: `if / else`, `while`, `for` loops
  - Functions & Call Stack: `function add(x, y) { return x + y; }`
  - Arrays & Memory indexing: `let arr = [10, 20, 30];`
  - Output display: `print(expr);`
- **Synchronized Source Mapping**:
  - The compiler generates line-to-line source maps.
  - As the CPU executes each machine instruction, both the active assembly instruction and the corresponding high-level source line are highlighted in real time!
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
    - Trapezoid hardware visualizer showing Operand A, Operand B, selected operation, and Result.
    - Condition Status Flags (LED style):
      - `Z` (Zero Flag)
      - `N` (Negative Flag)
      - `C` (Carry Flag)
      - `V` (Overflow Flag)
  - **Control Unit (CU)**:
    - 4-Stage Micro-Cycle State Machine:
      1. `FETCH`: `MAR <- PC`, `MBR <- RAM[MAR]`, `IR <- MBR`, `PC <- PC + 1`
      2. `DECODE`: Interprets opcode and resolves operands
      3. `EXECUTE`: Computes via ALU or updates branch target
      4. `WRITEBACK`: Commits result to Register or RAM
    - Visual indicators for hardware control lines (`MEM_RD`, `MEM_WR`, `ALU_EN`, `REG_LD`).

### 3. Animated System Buses
- **Address Bus** (Golden/Amber): Transmits memory addresses from MAR/PC to RAM.
- **Data Bus** (Cyan/Blue): Bidirectional transmission between RAM, MBR, Registers, and ALU with flowing data packets.
- **Control Bus** (Purple): Carries Read/Write and synchronization pulses.

### 4. RAM & Memory Model
- **256-Word Unified Memory (Von Neumann Model)**:
  - `0x00 - 0x7F`: **Code Segment** (Stores compiled machine instructions)
  - `0x80 - 0xCF`: **Data Segment** (Variables and arrays with memory labels)
  - `0xD0 - 0xFF`: **Stack Segment** (Call frames, return addresses, growing downwards from `0xFF`)
- **Live Memory Highlighting**:
  - Blue glow on RAM read operations
  - Green glow on RAM write operations
  - Amber border on PC pointer
  - Purple border on SP pointer
- Searchable address space and segment filter buttons.

### 5. Execution Controls & Time Travel
- **Play / Pause**: Automated clock execution with speed slider from 0.5 Hz to 20 Hz.
- **Micro-Step (F11)**: Advance one micro-cycle at a time (Fetch -> Decode -> Execute -> Writeback) to see internal state transitions.
- **Instruction Step (F10)**: Advance one full machine instruction.
- **Line Step**: Advance one full line of high-level code.
- **Step Back (Ctrl+Z)**: Reversible time-travel debugging — step backwards through execution history.
- **Reset (F8)**: Re-initialize CPU, registers, and memory back to cycle 0.

### 6. Built-in Preset Programs
1. **Variables & Math (Basics)**: Moving values between RAM, Registers, and computing arithmetic.
2. **Conditionals (If / Else)**: ALU comparison and branching using Condition Flags.
3. **While Loop (Sum 1 to 5)**: PC looping and register accumulation.
4. **Fibonacci Sequence**: Swapping variables in RAM and producing Fibonacci numbers.
5. **Function & Call Stack**: Stack frame creation, pushing parameters, and returning.
6. **Array Memory Traversal**: Contiguous memory access and pointer dereferencing.
7. **Bitwise Logic & Shifts**: AND, OR, XOR, and bit-shift operations directly at the ALU level.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle Run / Pause |
| `F11` | Micro-Cycle Step (Fetch $\rightarrow$ Decode $\rightarrow$ Execute $\rightarrow$ Writeback) |
| `F10` | Full Instruction Step |
| `Ctrl + Z` | Step Back (Undo / Time Travel) |
| `F8` | Reset CPU to Cycle 0 |
