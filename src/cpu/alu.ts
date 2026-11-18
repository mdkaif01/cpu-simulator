// Arithmetic Logic Unit (ALU) Implementation

import { AluOperation, AluState, CpuFlags } from '../types/cpu';

export interface AluResult {
  result: number;
  flags: CpuFlags;
  explanation: string;
}

export class ALU {
  public static execute(
    operation: AluOperation,
    operandA: number,
    operandB: number,
    currentFlags: CpuFlags
  ): AluResult {
    let rawResult = 0;
    let carry = false;
    let overflow = false;
    let explanation = '';

    // Mask to 16-bit signed/unsigned integer behavior for realism
    const toInt16 = (val: number) => {
      const v = val & 0xffff;
      return v >= 0x8000 ? v - 0x10000 : v;
    };

    switch (operation) {
      case 'ADD': {
        const fullSum = operandA + operandB;
        rawResult = toInt16(fullSum);
        carry = (fullSum & 0x10000) !== 0;
        overflow = ((operandA ^ rawResult) & (operandB ^ rawResult) & 0x8000) !== 0;
        explanation = `ALU added ${operandA} + ${operandB} = ${rawResult}`;
        break;
      }
      case 'SUB': {
        const fullDiff = operandA - operandB;
        rawResult = toInt16(fullDiff);
        carry = operandA < operandB;
        overflow = ((operandA ^ operandB) & (operandA ^ rawResult) & 0x8000) !== 0;
        explanation = `ALU subtracted ${operandA} - ${operandB} = ${rawResult}`;
        break;
      }
      case 'MUL': {
        rawResult = toInt16(operandA * operandB);
        explanation = `ALU multiplied ${operandA} * ${operandB} = ${rawResult}`;
        break;
      }
      case 'DIV': {
        if (operandB === 0) {
          rawResult = 0;
          explanation = 'ALU error: Division by zero, result clamped to 0';
        } else {
          rawResult = toInt16(Math.trunc(operandA / operandB));
          explanation = `ALU divided ${operandA} / ${operandB} = ${rawResult}`;
        }
        break;
      }
      case 'MOD': {
        if (operandB === 0) {
          rawResult = 0;
          explanation = 'ALU error: Modulo by zero, result clamped to 0';
        } else {
          rawResult = toInt16(operandA % operandB);
          explanation = `ALU modulo ${operandA} % ${operandB} = ${rawResult}`;
        }
        break;
      }
      case 'AND': {
        rawResult = toInt16(operandA & operandB);
        explanation = `ALU bitwise AND: ${operandA} & ${operandB} = ${rawResult} (0b${(rawResult & 0xff).toString(2).padStart(8, '0')})`;
        break;
      }
      case 'OR': {
        rawResult = toInt16(operandA | operandB);
        explanation = `ALU bitwise OR: ${operandA} | ${operandB} = ${rawResult} (0b${(rawResult & 0xff).toString(2).padStart(8, '0')})`;
        break;
      }
      case 'XOR': {
        rawResult = toInt16(operandA ^ operandB);
        explanation = `ALU bitwise XOR: ${operandA} ^ ${operandB} = ${rawResult} (0b${(rawResult & 0xff).toString(2).padStart(8, '0')})`;
        break;
      }
      case 'NOT': {
        rawResult = toInt16(~operandA);
        explanation = `ALU bitwise NOT: ~${operandA} = ${rawResult}`;
        break;
      }
      case 'SHL': {
        rawResult = toInt16(operandA << operandB);
        explanation = `ALU shifted left: ${operandA} << ${operandB} = ${rawResult}`;
        break;
      }
      case 'SHR': {
        rawResult = toInt16(operandA >> operandB);
        explanation = `ALU shifted right: ${operandA} >> ${operandB} = ${rawResult}`;
        break;
      }
      case 'CMP': {
        // Compare subtracts B from A without saving the result to a register, only updating flags
        const diff = operandA - operandB;
        rawResult = toInt16(diff);
        carry = operandA < operandB;
        overflow = ((operandA ^ operandB) & (operandA ^ rawResult) & 0x8000) !== 0;
        explanation = `ALU compared ${operandA} and ${operandB} (Difference = ${rawResult})`;
        break;
      }
      case 'PASS':
      default: {
        rawResult = operandA;
        explanation = `ALU passed through operand A = ${operandA}`;
        break;
      }
    }

    const flags: CpuFlags = {
      zero: rawResult === 0,
      negative: rawResult < 0,
      carry: carry,
      overflow: overflow
    };

    return {
      result: rawResult,
      flags,
      explanation
    };
  }
}
