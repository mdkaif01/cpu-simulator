export class ALU {
  static execute(operation, operandA, operandB, currentFlags) {
    let rawResult = 0;
    let carry = false;
    let overflow = false;
    let explanation = "";
    const toInt16 = (val) => {
      const v = val & 65535;
      return v >= 32768 ? v - 65536 : v;
    };
    switch (operation) {
      case "ADD": {
        const fullSum = operandA + operandB;
        rawResult = toInt16(fullSum);
        carry = (fullSum & 65536) !== 0;
        overflow = ((operandA ^ rawResult) & (operandB ^ rawResult) & 32768) !== 0;
        explanation = `ALU added ${operandA} + ${operandB} = ${rawResult}`;
        break;
      }
      case "SUB": {
        const fullDiff = operandA - operandB;
        rawResult = toInt16(fullDiff);
        carry = operandA < operandB;
        overflow = ((operandA ^ operandB) & (operandA ^ rawResult) & 32768) !== 0;
        explanation = `ALU subtracted ${operandA} - ${operandB} = ${rawResult}`;
        break;
      }
      case "MUL": {
        rawResult = toInt16(operandA * operandB);
        explanation = `ALU multiplied ${operandA} * ${operandB} = ${rawResult}`;
        break;
      }
      case "DIV": {
        if (operandB === 0) {
          rawResult = 0;
          explanation = "ALU error: Division by zero, result clamped to 0";
        } else {
          rawResult = toInt16(Math.trunc(operandA / operandB));
          explanation = `ALU divided ${operandA} / ${operandB} = ${rawResult}`;
        }
        break;
      }
      case "MOD": {
        if (operandB === 0) {
          rawResult = 0;
          explanation = "ALU error: Modulo by zero, result clamped to 0";
        } else {
          rawResult = toInt16(operandA % operandB);
          explanation = `ALU modulo ${operandA} % ${operandB} = ${rawResult}`;
        }
        break;
      }
      case "AND": {
        rawResult = toInt16(operandA & operandB);
        explanation = `ALU bitwise AND: ${operandA} & ${operandB} = ${rawResult} (0b${(rawResult & 255).toString(2).padStart(8, "0")})`;
        break;
      }
      case "OR": {
        rawResult = toInt16(operandA | operandB);
        explanation = `ALU bitwise OR: ${operandA} | ${operandB} = ${rawResult} (0b${(rawResult & 255).toString(2).padStart(8, "0")})`;
        break;
      }
      case "XOR": {
        rawResult = toInt16(operandA ^ operandB);
        explanation = `ALU bitwise XOR: ${operandA} ^ ${operandB} = ${rawResult} (0b${(rawResult & 255).toString(2).padStart(8, "0")})`;
        break;
      }
      case "NOT": {
        rawResult = toInt16(~operandA);
        explanation = `ALU bitwise NOT: ~${operandA} = ${rawResult}`;
        break;
      }
      case "SHL": {
        rawResult = toInt16(operandA << operandB);
        explanation = `ALU shifted left: ${operandA} << ${operandB} = ${rawResult}`;
        break;
      }
      case "SHR": {
        rawResult = toInt16(operandA >> operandB);
        explanation = `ALU shifted right: ${operandA} >> ${operandB} = ${rawResult}`;
        break;
      }
      case "CMP": {
        const diff = operandA - operandB;
        rawResult = toInt16(diff);
        carry = operandA < operandB;
        overflow = ((operandA ^ operandB) & (operandA ^ rawResult) & 32768) !== 0;
        explanation = `ALU compared ${operandA} and ${operandB} (Difference = ${rawResult})`;
        break;
      }
      case "PASS":
      default: {
        rawResult = operandA;
        explanation = `ALU passed through operand A = ${operandA}`;
        break;
      }
    }
    const flags = {
      zero: rawResult === 0,
      negative: rawResult < 0,
      carry,
      overflow
    };
    return {
      result: rawResult,
      flags,
      explanation
    };
  }
}
