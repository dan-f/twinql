import { UnexpectedTokenError } from '../errors'
import lex from './lexer'
import * as AST from './ast'
import { tokenTypes } from './tokens'

// Helper for navigating the token stream

const ANY = '*'

class TokenStream {
  constructor (iterator) {
    this.iterator = iterator
    this.buffer = []
    this.advance()
  }

  advance () {
    this.current = this.buffer.length
      ? this.buffer.shift()
      : this._pull()
  }

  lookahead (k) {
    const needed = k - this.buffer.length
    for (let i = 0; i < needed; i++) {
      this.buffer.push(this._pull())
    }
    return this.buffer.slice(0, k)
  }

  expect (...tokenTypes) {
    const tokenTypeSet = new Set(tokenTypes)
    if (tokenTypeSet.has(ANY) || (tokenTypeSet.has(this.current.type))) {
      return true
    }
    throw new UnexpectedTokenError(
      tokenTypes, this.current
    )
  }

  when (tokenTypesToHandlers) {
    const tokenTypes = Object.keys(tokenTypesToHandlers)
    const tokenTypeSet = new Set(tokenTypes)
    this.expect(...tokenTypes)
    if (tokenTypeSet.has(this.current.type)) {
      return tokenTypesToHandlers[this.current.type]()
    }
    return tokenTypesToHandlers[ANY]()
  }

  _pull () {
    return this.iterator.next().value
  }
}

// Parse functions

export default function parse (input, parseFn = query) {
  return parseFn(new TokenStream(lex(input)))
}

export function query (t) {
  const { EOF } = tokenTypes
  const _queryNode = AST.queryNode({
    prefixList: prefixList(t),
    context: context(t),
    contextSensitiveQuery: contextSensitiveQuery(t)
  })
  t.expect(EOF)
  return _queryNode
}

export function prefixList (t) {
  const { PREFIX, URI, PREFIXED_URI } = tokenTypes
  t.expect(PREFIX, URI, PREFIXED_URI)
  const prefixes = []
  while (t.current.type === PREFIX) {
    prefixes.push(prefix(t))
  }
  return prefixes
}

export function prefix (t) {
  const { PREFIX } = tokenTypes
  t.expect(PREFIX)
  t.advance()
  return AST.prefixNode({
    name: name(t),
    uri: uri(t)
  })
}

export const context = id

export function contextSensitiveQuery (t) {
  return AST.contextSensitiveQueryNode({
    nodeSpecifier: nodeSpecifier(t),
    traversal: traversal(t)
  })
}

export function nodeSpecifier (t) {
  const { ARROW, LPAREN, RPAREN } = tokenTypes
  return t.when({
    [ARROW]: () => {
      t.advance()
      t.expect(LPAREN)
      t.advance()
      const nodeSpec = AST.matchingNodeSpecifierNode({
        contextType: 'graph',
        matchList: matchList(t)
      })
      t.expect(RPAREN)
      t.advance()
      return nodeSpec
    },
    [LPAREN]: () => {
      t.advance()
      const nodeSpec = AST.matchingNodeSpecifierNode({
        contextType: 'subject',
        matchList: matchList(t)
      })
      t.expect(RPAREN)
      t.advance()
      return nodeSpec
    },
    [ANY]: () => AST.emptyNodeSpecifierNode()
  })
}

export function matchList (t) {
  const { URI, PREFIXED_URI } = tokenTypes
  const beginningMatchTokens = new Set([URI, PREFIXED_URI])
  const matches = []
  while (beginningMatchTokens.has(t.current.type)) {
    matches.push(match(t))
  }
  return matches
}

export function match (t) {
  const { URI, PREFIXED_URI, STRLIT, LPAREN } = tokenTypes
  const pred = predicate(t)
  return t.when({
    [URI]: () => AST.leafMatchNode({
      predicate: pred,
      value: uri(t)
    }),
    [PREFIXED_URI]: () => AST.leafMatchNode({
      predicate: pred,
      value: prefixedUri(t)
    }),
    [STRLIT]: () => AST.leafMatchNode({
      predicate: pred,
      value: string(t)
    }),
    [LPAREN]: () => AST.intermediateMatchNode({
      predicate: pred,
      nodeSpecifier: nodeSpecifier(t)
    })
  })
}

const predicate = id

export function id (t) {
  const { URI, PREFIXED_URI } = tokenTypes
  return t.when({
    [URI]: () => uri(t),
    [PREFIXED_URI]: () => prefixedUri(t)
  })
}

export function uri (t) {
  const { URI } = tokenTypes
  const _uri = t.when({
    [URI]: () => AST.uriNode({ value: t.current.value })
  })
  t.advance()
  return _uri
}

export function prefixedUri (t) {
  const { PREFIXED_URI } = tokenTypes
  const _uri = t.when({
    [PREFIXED_URI]: () => {
      const { prefix, path } = t.current.value
      return AST.prefixedUriNode({ prefix, path })
    }
  })
  t.advance()
  return _uri
}

export function name (t) {
  const { NAME } = tokenTypes
  t.expect(NAME)
  const _name = AST.nameNode({ value: t.current.value })
  t.advance()
  return _name
}

export function string (t) {
  const { STRLIT } = tokenTypes
  const _string = t.when({[STRLIT]: () => AST.stringLiteralNode({ value: t.current.value })})
  t.advance()
  return _string
}

export function traversal (t) {
  const { LBRACE, RBRACE } = tokenTypes
  t.expect(LBRACE)
  t.advance()
  const selectors = selectorList(t)
  t.expect(RBRACE)
  t.advance()
  return AST.traversalNode({selectorList: selectors})
}

export function selectorList (t) {
  const { LSQUARE, URI, PREFIXED_URI } = tokenTypes
  const edgeTypes = new Set([LSQUARE, URI, PREFIXED_URI])
  const selectors = []
  while (edgeTypes.has(t.current.type)) {
    selectors.push(selector(t))
  }
  return selectors
}

export function selector (t) {
  const { ARROW, LPAREN, LBRACE } = tokenTypes
  const _edge = edge(t)
  return t.when({
    [LPAREN]: () => AST.intermediateSelectorNode({
      edge: _edge,
      contextSensitiveQuery: contextSensitiveQuery(t)
    }),
    [LBRACE]: () => AST.intermediateSelectorNode({
      edge: _edge,
      contextSensitiveQuery: contextSensitiveQuery(t)
    }),
    [ARROW]: () => AST.intermediateSelectorNode({
      edge: _edge,
      contextSensitiveQuery: contextSensitiveQuery(t)
    }),
    [ANY]: () => AST.leafSelectorNode({edge: _edge})
  })
}

export function edge (t) {
  const { LSQUARE, URI, PREFIXED_URI } = tokenTypes
  return t.when({
    [LSQUARE]: () => {
      t.advance()
      const _predicate = id(t)
      t.advance()
      return AST.multiEdgeNode({ predicate: _predicate })
    },
    [URI]: () => AST.singleEdgeNode({ predicate: id(t) }),
    [PREFIXED_URI]: () => AST.singleEdgeNode({ predicate: id(t) })
  })
}
