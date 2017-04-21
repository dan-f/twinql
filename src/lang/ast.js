/**
 * Contains definitions for nodes in the abstract syntax tree
 * @module
 */

/**
 * The class for abstract syntax tree nodes
 */
export class AST {
  constructor ({ type, ...attrs }) {
    if (!type) {
      throw new Error('Must provide a `type` when constructing a AST')
    }
    this.type = type
    Object.assign(this, attrs)
  }
}

export const queryNode = ({ prefixList, context, contextSensitiveQuery }) => new AST({
  type: 'query',
  prefixList,
  context,
  contextSensitiveQuery
})

export const prefixNode = ({ name, uri }) => new AST({
  type: 'prefix',
  name,
  uri
})

export const contextSensitiveQueryNode = ({ nodeSpecifier, traversal }) => new AST({
  type: 'contextSensitiveQuery',
  nodeSpecifier,
  traversal
})

export const matchingNodeSpecifierNode = ({ contextType, matchList }) => new AST({
  type: 'matchingNodeSpecifier',
  contextType,
  matchList
})

export const emptyNodeSpecifierNode = () => new AST({
  type: 'emptyNodeSpecifier'
})

export const leafMatchNode = ({ predicate, value }) => new AST({
  type: 'leafMatch',
  predicate,
  value
})

export const intermediateMatchNode = ({ predicate, nodeSpecifier }) => new AST({
  type: 'intermediateMatch',
  predicate,
  nodeSpecifier
})

export const traversalNode = ({ selectorList }) => new AST({
  type: 'traversal',
  selectorList
})

export const leafSelectorNode = ({ edge }) => new AST({
  type: 'leafSelector',
  edge
})

export const intermediateSelectorNode = ({ edge, contextSensitiveQuery }) => new AST({
  type: 'intermediateSelector',
  edge,
  contextSensitiveQuery
})

export const singleEdgeNode = ({ predicate }) => new AST({
  type: 'singleEdge',
  predicate
})

export const multiEdgeNode = ({ predicate }) => new AST({
  type: 'multiEdge',
  predicate
})

export const uriNode = ({ value }) => new AST({
  type: 'uri',
  value
})

export const prefixedUriNode = ({ prefix, path }) => new AST({
  type: 'prefixedUri',
  prefix,
  path
})

export const nameNode = ({ value }) => new AST({
  type: 'name',
  value
})

export const stringLiteralNode = ({ value }) => new AST({
  type: 'stringLiteral',
  value
})
