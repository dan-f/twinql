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
    this.name = 'LexError'
  }
}

/**
 * Class of errors for when the lexer encounters an illegal character
 * @extends {module:errors~LexError}
 */
export class IllegalCharacterError extends LexError {
  constructor (...args) {
    super(...args)
    this.name = 'IllegalCharacterError'
  }
}

/**
 * Class of errors for when the lexer encounters an uncompleted token
 * @extends {module:errors~LexError}
 */
export class UnterminatedTokenError extends LexError {
  constructor (...args) {
    super(...args)
    this.name = 'UnterminatedTokenError'
  }
}

/**
 * Class of errors for when the lexer encounters a token which doesn't match the
 * syntax
 */
export class UnrecognizedTokenError extends LexError {
  constructor (...args) {
    super(...args)
    this.name = 'UnrecognizedTokenError'
  }
}

/**
 * Class of errors for errors occurring during parsing
 */
class ParseError extends Error {
  constructor (...args) {
    super(...args)
    this.name = 'ParseError'
  }
}

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
    this.name = 'UnexpectedTokenError'
  }
}

/**
 * Class of errors for errors occurring at query time
 */
export class QueryError extends Error {
  constructor (...args) {
    super(...args)
    this.name = 'QueryError'
  }
}

/**
 * Class of errors that occur during HTTP requests.  Can be thrown when a
 * response is not a 2XX status.
 */
export class HttpError extends Error {
  constructor (response) {
    super(response.statusText)
    this.name = 'HttpError'
    this.status = response.status
    this.response = response
  }
}

/**
 * Class of errors that occur when parsing text as RDF.
 */
export class RdfParseError extends Error {
  constructor (...args) {
    super(...args)
    this.name = 'RdfParseError'
  }
}

export class GraphError extends Error {
  constructor (...args) {
    super(...args)
    this.name = 'GraphError'
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
    this.name = 'NotImplementedError'
  }
}

/**
 * Describes the set of errors which should be "inlined" (included at node
 * level) in the response
 */
const ERRORS_TO_BE_INLINED = new Set(['HttpError', 'RdfParseError'])

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
