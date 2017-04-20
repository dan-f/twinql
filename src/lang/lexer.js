import { isWebUri } from 'valid-url'

import {
  IllegalCharacterError,
  UnrecognizedTokenError,
  UnterminatedTokenError
} from '../errors'
import {
  keywords,
  NAME_REGEX,
  PREFIXED_URI_REGEX,
  symbols,
  Token,
  tokenTypes
} from './tokens'

// LIMITATIONS:
// - For now, assuming \n for newlines and no unicode.

// States for the DFA
const states = {
  START: 'START',
  ID: 'ID',
  STRING: 'STRING',
  SYMBOL: 'SYMBOL',
  KEYWORD: 'KEYWORD'
}

// Characters with significance to lexing logic but no token significance
const chars = {
  NEWLINE: '\n',
  QUOTE: '"'
}

/**
 * Returns an iterable over the token stream of its input.
 */
function * lex (input) {
  let line = 1                  // the line we're on
  let col = -1                  // the column we're on
  let curVal                    // the value of the token we're reading
  let state                     // the starting state of our DFA

  // It would be nice to use a for (let char of input) {...} loop, but we don't
  // always want to proceed to the next character at the end of the loop.
  const iter = input[Symbol.iterator]()
  let cur

  // Some stateful helper functions to control the imperative mutative algorithm
  const advance = () => {
    col++
    cur = iter.next()
  }
  const reset = () => {
    curVal = ''
    state = states.START
  }

  reset()
  advance()

  while (!cur.done) {
    const char = cur.value
    switch (state) {
      case states.START:
        if (isSpace(char)) {
          if (char === chars.NEWLINE) {
            col = 0
            line++
          }
        } else if (starts(char, symbols)) {
          curVal += char
          state = states.SYMBOL
        } else if (starts(char, keywords)) {
          curVal += char
          state = states.KEYWORD
        } else if (char === chars.QUOTE) {
          state = states.STRING
        } else if (isAlpha(char)) {
          curVal += char
          state = states.ID
        } else {
          throw new IllegalCharacterError(`Illegal character '${char}'`, line, col)
        }
        advance()
        break
      case states.ID:
        if (isSpace(char)) {
          yield id(curVal, line, col)
          reset()
        } else {
          curVal += char
          advance()
        }
        break
      case states.STRING:
        if (char === chars.QUOTE) {
          yield new Token(tokenTypes.STRLIT, curVal, line, col)
          advance()
          reset()
        } else {
          curVal += char
          advance()
        }
        break
      case states.SYMBOL:
        if (starts(curVal + char, symbols)) {
          curVal += char
          advance()
        } else {
          yield new Token(symbols[curVal], curVal, line, col)
          reset()
        }
        break
      case states.KEYWORD:
        if (isSpace(char)) {
          yield new Token(keywords[curVal], curVal, line, col)
          reset()
        } else if (starts(curVal + char, keywords)) {
          curVal += char
          advance()
        }
        break
    }
  }

  // Handle what happens if we're not in the start state at the end of input
  switch (state) {
    case states.SYMBOL:
      if (symbols[curVal]) {
        yield new Token(symbols[curVal], curVal, line, col)
      } else {
        throw new UnterminatedTokenError(`Unterminated symbol '${curVal}'`, line, col)
      }
      break
    case states.KEYWORD:
      if (keywords[curVal]) {
        yield new Token(keywords[curVal], curVal, line, col)
      } else {
        throw new UnterminatedTokenError(`Unterminated keyword '${curVal}'`, line, col)
      }
      break
    case states.STRING:
      throw new UnterminatedTokenError(`Unterminated string literal '${curVal}'`, line, col)
    case states.ID:
      yield id(curVal, line, col)
      break
  }
  yield new Token(tokenTypes.EOF, null, line, col)
}

// Helper functions

function isSpace (char) {
  return char === ' ' ||
    char === '\n' ||
    char === '\r' ||
    char === '\t'
}

function isAlpha (char) {
  return /[a-z]/i.test(char)
}

function starts (char, tokenGroup) {
  return Object.keys(tokenGroup)
    .filter(tokenText => tokenText.startsWith(char))
    .length > 0
}

function id (val, line, col) {
  if (NAME_REGEX.test(val)) {
    return new Token(tokenTypes.NAME, val, line, col)
  }
  if (isWebUri(val)) {
    return new Token(tokenTypes.URI, val, line, col)
  }
  if (PREFIXED_URI_REGEX.test(val)) {
    const [ _, prefix, path ] = PREFIXED_URI_REGEX.exec(val) // eslint-disable-line
    return new Token(tokenTypes.PREFIXED_URI, { prefix, path }, line, col)
  }
  throw new UnrecognizedTokenError(`Unrecognized token: ${val}`, line, col)
}

export default lex
