/**
 * Error classes used throughout the library
 * @module
 */

/**
 * Class of errors that occur during lexing
 */
class LexError extends Error {
  constructor (message, line, col) {
    super(`${line}:${col}: ${message}`)
  }
}

/**
 * Class of errors for when the lexer encounters an illegal character
 * @extends {module:errors~LexError}
 */
export class IllegalCharacterError extends LexError {}

/**
 * Class of errors for when the lexer unexpectedly reaches the end of the buffer
 * @extends {module:errors~LexError}
 */
export class EndOfInputError extends LexError {}

/**
 * Class of errors for when the lexer encounters an uncompleted token
 * @extends {module:errors~LexError}
 */
export class UnterminatedTokenError extends LexError {}

/**
 * Class of errors for when the lexer encounters a token which doesn't match the
 * syntax
 */
export class UnrecognizedTokenError extends LexError {}

/**
 * Class of errors for errors occurring during parsing
 */
class ParseError extends Error {}

/**
 * Class of errors for when the parser sees a token that doesn't follow the
 * grammar
 * @extends {module:errors~ParseError}
 */
export class UnexpectedTokenError extends ParseError {
  /**
   * Create a UnexpectedTokenError
   * @param {Array<String>} expectedTokenTypes
   * @param {String} receivedToken
   */
  constructor (expectedTokenTypes, receivedToken) {
    super(
      `Expected a token of type(s) [${expectedTokenTypes.join(', ')}], ` +
      `but got token '${receivedToken.value}' of type ${receivedToken.type} ` +
      `at (${receivedToken.line}:${receivedToken.column})`
    )
  }
}

/**
 * Class of errors for errors occurring at query time
 */
export class QueryError extends Error {}

/**
 * Class of errors for when a class that is meant to be 'abstract' (i.e. not
 * directly instantiated) is directly instatiated
 */
export class AbstractClassError extends Error {
  /**
   * Create an AbstractClassError
   * @param {String} className
   * @param {String} message
   */
  constructor (className, message) {
    super(`<${className}> class is abstract and cannot be directly instantiated.  ${message}`)
  }
}

/**
 * Class of errors for when an abstract method is called
 */
export class NotImplementedError extends Error {
  /**
   * Create a NotImplementedError
   * @param {String} methodName
   * @param {String} className
   */
  constructor (methodName, className) {
    super(`${methodName} not implemented on ${className}`)
  }
}

/**
 * Describes the set of errors which should be "inlined" (included at node
 * level) in the response
 */
const ERRORS_TO_BE_INLINED = new Set(['HttpError'])

/**
 * Returns whether the given error should be included in the query response
 * @param {Error} error
 */
export function isInlineError (error) {
  return ERRORS_TO_BE_INLINED.has(error.name)
}

/**
 * Formats a given error as a plain object to be included in the query response
 * @param {Error} error
 */
export function formatErrorForResponse (error) {
  const type = error.name
  const message = error.message
  const formatted = {
    type,
    message
  }
  switch (type) {
    case 'HttpError':
      return { ...formatted, status: error.status }
    default:
      return formatted
  }
}
