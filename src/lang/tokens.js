// An enumeration of language tokens
export const tokenTypes = {
  URI: 'URI',
  PREFIXED_URI: 'PREFIXED_URI',
  NAME: 'NAME',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LSQUARE: 'LSQUARE',
  RSQUARE: 'RSQUARE',
  STRLIT: 'STRLIT',
  ON: 'ON',
  DEL: 'DEL',
  INS: 'INS',
  ARROW: 'ARROW',
  PREFIX: 'PREFIX',
  EOF: 'EOF'
}

// A mapping from token text to token types
export const keywords = {
  '-': tokenTypes.DEL,
  '+': tokenTypes.INS,
  '=>': tokenTypes.ARROW,
  '@prefix': tokenTypes.PREFIX
}

// A mapping from symbols to token types
export const symbols = {
  '(': tokenTypes.LPAREN,
  ')': tokenTypes.RPAREN,
  '{': tokenTypes.LBRACE,
  '}': tokenTypes.RBRACE,
  '[': tokenTypes.LSQUARE,
  ']': tokenTypes.RSQUARE
}

export const NAME_REGEX = /^[a-zA-Z]+[a-zA-Z0-9_-]*$/

// Captures two groups.  The first is the prefixed name and the second is the
// path.
export const PREFIXED_URI_REGEX = /^([a-zA-Z]+[a-zA-Z0-9_-]*):(.+)$/

export class Token {
  constructor(type, value, line, column) {
    this.type = type
    this.value = value
    this.line = line
    this.column = column
  }
}
