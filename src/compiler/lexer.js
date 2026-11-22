const C_TYPES = /* @__PURE__ */ new Set([
  "int",
  "float",
  "double",
  "char",
  "short",
  "long",
  "unsigned",
  "signed",
  "void",
  "bool"
]);
const KEYWORDS = /* @__PURE__ */ new Set([
  "let",
  "var",
  "const",
  "if",
  "else",
  "while",
  "for",
  "function",
  "return",
  "print",
  "printf",
  "puts",
  "console",
  "main",
  "sizeof"
]);
export function tokenize(source) {
  const tokens = [];
  let line = 1;
  let col = 1;
  let i = 0;
  const peek = () => i < source.length ? source[i] : "\0";
  const advance = () => {
    const ch = source[i++];
    if (ch === "\n") {
      line++;
      col = 1;
    } else {
      col++;
    }
    return ch;
  };
  while (i < source.length) {
    const ch = peek();
    if (/\s/.test(ch)) {
      advance();
      continue;
    }
    if (ch === "#") {
      while (i < source.length && peek() !== "\n") {
        advance();
      }
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && peek() !== "\n") {
        advance();
      }
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      advance();
      advance();
      while (i < source.length && !(peek() === "*" && source[i + 1] === "/")) {
        advance();
      }
      if (i < source.length) {
        advance();
        advance();
      }
      continue;
    }
    if (ch === '"') {
      const startCol = col;
      advance();
      let strVal = "";
      while (i < source.length && peek() !== '"' && peek() !== "\n") {
        if (peek() === "\\") {
          advance();
          const escaped = advance();
          if (escaped === "n") strVal += "\n";
          else if (escaped === "t") strVal += "	";
          else strVal += escaped;
        } else {
          strVal += advance();
        }
      }
      if (peek() === '"') {
        advance();
      }
      tokens.push({ type: "STRING", value: strVal, line, column: startCol });
      continue;
    }
    if (ch === "'") {
      const startCol = col;
      advance();
      let charVal = 0;
      if (peek() === "\\") {
        advance();
        const esc = advance();
        charVal = esc === "n" ? 10 : esc === "0" ? 0 : esc.charCodeAt(0);
      } else {
        charVal = advance().charCodeAt(0);
      }
      if (peek() === "'") {
        advance();
      }
      tokens.push({ type: "NUMBER", value: charVal.toString(), line, column: startCol });
      continue;
    }
    if (/[0-9]/.test(ch)) {
      const startCol = col;
      let numStr = "";
      if (ch === "0" && (source[i + 1] === "x" || source[i + 1] === "X")) {
        numStr += advance();
        numStr += advance();
        while (/[0-9a-fA-F]/.test(peek())) {
          numStr += advance();
        }
      } else {
        while (/[0-9]/.test(peek())) {
          numStr += advance();
        }
      }
      tokens.push({ type: "NUMBER", value: numStr, line, column: startCol });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      const startCol = col;
      let ident = "";
      while (/[a-zA-Z0-9_]/.test(peek())) {
        ident += advance();
      }
      if (C_TYPES.has(ident)) {
        tokens.push({ type: "TYPE", value: ident, line, column: startCol });
      } else if (KEYWORDS.has(ident)) {
        tokens.push({ type: "KEYWORD", value: ident, line, column: startCol });
      } else {
        tokens.push({ type: "IDENTIFIER", value: ident, line, column: startCol });
      }
      continue;
    }
    const twoChar = source.slice(i, i + 2);
    if ([
      "==",
      "!=",
      "<=",
      ">=",
      "&&",
      "||",
      "<<",
      ">>",
      "++",
      "--",
      "+=",
      "-=",
      "*=",
      "/=",
      "%="
    ].includes(twoChar)) {
      const startCol = col;
      advance();
      advance();
      tokens.push({ type: "OPERATOR", value: twoChar, line, column: startCol });
      continue;
    }
    if (["+", "-", "*", "/", "%", "<", ">", "&", "|", "^", "!"].includes(ch)) {
      const startCol = col;
      advance();
      tokens.push({ type: "OPERATOR", value: ch, line, column: startCol });
      continue;
    }
    if (["=", ";", ",", "(", ")", "{", "}", "[", "]", ".", "?", ":"].includes(ch)) {
      const startCol = col;
      advance();
      tokens.push({ type: "PUNCTUATION", value: ch, line, column: startCol });
      continue;
    }
    throw new Error(`Unexpected character '${ch}' at line ${line}, column ${col}`);
  }
  tokens.push({ type: "EOF", value: "", line, column: col });
  return tokens;
}
