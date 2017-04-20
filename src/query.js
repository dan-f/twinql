import { formatErrorForResponse, isInlineError, QueryError } from './errors'
import { Node, nodeSet } from './rdf/node'
import parse from './lang/parser'
import { iterObj } from './util'

/**
 * The query module
 * @module
 */

const all = Promise.all.bind(Promise)

/**
 * A query response as a JSON-LD graph.  Mostly complies to the JSON-LD spec but
 * with a few extensions (currently just an '@error' property for nodes that
 * fail to be queried)
 * @typedef {Object} Response
 */

/**
 * Execute a query on a backend
 * @param {module:backends/backend~Backend} backend - the backend to query
 * @param {String} [q = ''] - the query
 * @returns {Promise<module:query~Response>} the response graph
 */
async function query (backend, q = '') {
  const parsedQuery = parse(q || '')
  const resp = await new QueryEngine(backend).query(parsedQuery)
  backend.trigger('queryDone')
  return resp
}

/**
 * Encapsulates a backend and a bit of state (the prefix map, for example) for
 * the various query functions
 */
class QueryEngine {
  /**
   * Creates a QueryEngine
   * @param {module:backends/backend~Backend} backend
   */
  constructor (backend) {
    this.backend = backend
  }

  /**
   * Runs a query against the backend
   * @param {module:lang/ast.AST} ast - the AST of the query
   * @returns {Promise<module:query~Response>} the response graph
   */
  async query (ast) {
    this.prefixMap = this.getPrefixMap(ast.prefixList)
    const queryResults = await this.contextSensitiveQuery(this.toNode(ast.context), ast.contextSensitiveQuery)
    return {
      '@context': this.prefixMap,
      ...queryResults
    }
  }

  /**
   * Constructs a map of prefix names to base URIs from a prefixList AST node
   * @param {module:lang/ast.AST} prefixList - the prefixList AST node
   * @returns {Object} A mapping of prefix names (e.g. foaf) to base URIs
   */
  getPrefixMap (prefixList) {
    return prefixList
      .reduce((map, prefix) => ({
        ...map,
        [prefix.name.value]: prefix.uri.value
      }), {})
  }

  /**
   * Gets the query response for a context-sensitive query given a context node,
   * which are resolved at runtime.
   * @param {module:lang/ast.AST} contextNode - the context AST node
   * @param {module:lang/ast.AST} csq - the contextSensitiveQuery AST node
   * @returns {Promise<module:query~Response>} the response graph
   */
  async contextSensitiveQuery (contextNode, csq) {
    const nodeSpec = csq.nodeSpecifier
    const nodes = await this.specifiedNodes(nodeSet([contextNode]), nodeSpec)
    const results = await Promise.all(nodes.map(node => this.traverse(node, csq.traversal)))
    if (!results.length) {
      return {}
    }
    const { type, contextType } = nodeSpec
    if (type === 'emptyNodeSpecifier' || (type === 'matchingNodeSpecifier' && contextType === 'subject')) {
      return results[0]
    } else if (type === 'matchingNodeSpecifier' && contextType === 'graph') {
      return {
        '@id': contextNode.get('value'),
        '@graph': results
      }
    }
    throw new QueryError(`Unrecognized context type for node specifier.  Expected 'graph' or 'subject', but got: ${nodeSpec.contextType}`)
  }

  /**
   * Get the set of nodes matching a nodeSpecifier given the current context
   * @param {module:rdf/node~NodeSet} context - the set of context nodes
   * @param {module:lang/ast.AST} nodeSpec - the nodeSpecifier AST node
   * @returns {Promise<module:rdf/node~NodeSet>} the set of matching nodes
   */
  async specifiedNodes (context, nodeSpec) {
    switch (nodeSpec.type) {
      case 'uri':
      case 'prefixedUri':
        return nodeSet([this.toNode(nodeSpec)])
      case 'emptyNodeSpecifier':
        return context
      case 'matchingNodeSpecifier':
        return this.matchesMatchList(context, nodeSpec.contextType, nodeSpec.matchList)
      default:
        throw new QueryError(`Invalid node specifier type: ${nodeSpec}`)
    }
  }

  /**
   * Returns the set of nodes which match a match list given the current context
   * @param {module:rdf/node~NodeSet} context - the set of context nodes
   * @param {String} contextType - the kind of context; either "graph" or
   * "subject"
   * @param {Array<module:lang/ast.AST>} matchList - the list of AST match nodes
   * @returns {Promise<module:rdf/node~NodeSet>} the set of nodes matching the match list
   */
  async matchesMatchList (context, contextType, matchList) {
    return (await all(
      matchList.map(match => this.matches(context, contextType, match))
    )).reduce((allMatches, curMatches) => allMatches.intersect(curMatches))
  }

  /**
   * Returns the set of nodes which match a given match given the current context
   * @param {module:rdf/node~NodeSet} context - the set of context nodes
   * @param {String} contextType - the kind of context; either "graph" or
   * "subject"
   * @param {module:lang/ast.AST} match - the match AST node
   * @returns {Promise<module:rdf/node~NodeSet>} the set of nodes matching the
   * current match
   */
  async matches (context, contextType, match) {
    switch (contextType) {
      case 'subject':
        try {
          const nodesMatchingContextAndPredicate = (await all(
            context.map(node => this.backend.getObjects(node, this.toNode(match.predicate)))
          )).reduce((allNodes, currentNodes) => allNodes.union(currentNodes))
          const nodesMatchingSubNodeSpec = await this.specifiedNodes(
            nodesMatchingContextAndPredicate,
            match.type === 'intermediateMatch'
              ? match.nodeSpecifier
              : match.value
          )
          const nodesMatchingMatch = (await all(
            nodesMatchingSubNodeSpec.map(node => this.backend.getSubjects(this.toNode(match.predicate), node))
          )).reduce((allNodes, currentNodes) => allNodes.union(currentNodes))
          return context.intersect(nodesMatchingMatch)
        } catch (error) {
          return nodeSet([])
        }
      case 'graph':
        try {
          return context.map(async namedGraph => {
            return (await all(
              (await this.specifiedNodes(null, match.type === 'intermediateMatch' ? match.nodeSpecifier : match.value))
                .map(node => this.backend.getSubjects(this.toNode(match.predicate), node, namedGraph))
            )).reduce((allNodes, currentNodes) => allNodes.union(currentNodes))
          }).reduce((allNodes, currentNodes) => allNodes.union(currentNodes))
        } catch (error) {
          return nodeSet([])
        }
      default:
        throw new QueryError(`Invalid context type: ${contextType}`)
    }
  }

  /**
   * Gets the response graph for a specific traversal (i.e. list of edges and
   * subqueries) for a given node
   * @param {module:rdf/node.Node} node - the node to traverse
   * @param {module:lang/ast.AST} traversal - the traversal AST node
   * @returns {Promise<module:query~Response>} the response graph for the current node
   */
  async traverse (node, traversal) {
    let error
    let results = []
    for (let selectorNode of traversal.selectorList) {
      if (error) { break }
      switch (selectorNode.type) {
        case 'leafSelector':
          try {
            results.push(await this.traverseLeafSelector(node, selectorNode))
          } catch (e) {
            if (isInlineError(e)) {
              error = e
            } else {
              throw e
            }
          }
          break
        case 'intermediateSelector':
          results.push(await this.traverseIntermediateSelector(node, selectorNode))
          break
        default:
          throw new QueryError(`Invalid selector type.  Expected 'leafSelector' or 'intermediateSelector', but got: ${selectorNode.type}`)
      }
    }
    return error
      ? {
        '@id': node.get('value'),
        '@error': formatErrorForResponse(error)
      }
      : {
        '@id': node.get('value'),
        ...results.reduce((response, result) => ({
          ...response,
          ...result
        }), {})
      }
  }

  /**
   * Traverses a single edge with no subquery on a given node
   * @param {module:rdf/node.Node} node - the node to traverse
   * @param {module:lang/ast.AST} selectorNode - the selector AST node
   * @returns {Promise<Object>} the response for the edge traversal
   */
  async traverseLeafSelector (node, selectorNode) {
    const { edge } = selectorNode
    const predicateValue = this.toNode(edge.predicate).get('value')
    let finalObjects
    switch (edge.type) {
      case 'singleEdge':
        finalObjects = formatNode((await this.getNextObjectForSelector(node, edge)))
        break
      case 'multiEdge':
        finalObjects = (await this.getNextObjectsForSelector(node, edge))
          .map(formatNode)
        break
      default:
        throw new QueryError(`Unrecognized edge type.  Expected 'singleEdge' or 'multiEdge' but got '${edge.type}'.`)
    }
    return { [this.toPrefixed(predicateValue)]: finalObjects }
  }

  /**
   * Traverses a single edge with a subquery on a given node
   * @param {module:rdf/node.Node} node - the node to traverse
   * @param {module:lang/ast.AST} selectorNode - the selector AST node
   * @returns {Promise<Object>} the sub-response for the edge traversal
   */
  async traverseIntermediateSelector (node, selectorNode) {
    const { edge, contextSensitiveQuery } = selectorNode
    let subQueryResults
    switch (edge.type) {
      case 'singleEdge':
        const nextObject = await this.getNextObjectForSelector(node, edge)
        subQueryResults = nextObject
          ? await this.contextSensitiveQuery(nextObject, contextSensitiveQuery)
          : null
        break
      case 'multiEdge':
        const nextObjects = await this.getNextObjectsForSelector(node, edge)
        subQueryResults = (await all(nextObjects.map(async node =>
          this.contextSensitiveQuery(node, contextSensitiveQuery)
        ))).filter(result => result != null)
        break
      default:
        throw new QueryError(`Unrecognized edge type.  Expected 'singleEdge' or 'multiEdge' but got '${edge.type}'.`)
    }
    const predicateValue = this.toNode(edge.predicate).get('value')
    return { [this.toPrefixed(predicateValue)]: subQueryResults }
  }

  /**
   * Returns the set of objects to traverse given the current selector edge.
   * @param {module:rdf/node.Node} node - the node to traverse
   * @param {module:lang/ast.AST} edge - the edge AST node
   * @returs {Promise<module:rdf/node~NodeSet>} the set of objects pointed to
   *     by the current node and the edge
   */
  async getNextObjectsForSelector (node, edge) {
    const { predicate } = edge
    switch (edge.type) {
      case 'multiEdge':
        return this.backend.getObjects(node, this.toNode(predicate))
      default:
        throw new QueryError(`Edge type must be 'multiEdge' but got '${edge.type}'.`)
    }
  }

  async getNextObjectForSelector (node, edge) {
    const { predicate } = edge
    switch (edge.type) {
      case 'singleEdge':
        return (await this.backend.getObjects(node, this.toNode(predicate))).first() || null
      default:
        throw new QueryError(`Edge type must be 'singleEdge' but got '${edge.type}'.`)
    }
  }

  /**
   * Converts an ID AST node to a {@link module:rdf/node.Node}
   * @param {module:lang/ast.AST} ast - the AST node
   * @returns {@link module:rdf/node.Node} the converted node
   */
  toNode (ast) {
    const data = { termType: 'NamedNode' }
    switch (ast.type) {
      case 'uri':
        return Node({ ...data, value: ast.value })
      case 'prefixedUri':
        const prefixUri = this.prefixMap[ast.prefix]
        if (prefixUri) {
          return Node({ ...data, value: this.prefixMap[ast.prefix] + ast.path })
        } else {
          throw new QueryError(`Missing prefix definition for "${ast.prefix}"`)
        }
      default:
        throw new QueryError(`Cannot convert from ${ast} to an RDF NamedNode.  Expected type 'uri' or 'prefixedUri'`)
    }
  }

  /**
   * Converts a URI to the prefixed version for the response if the prefix map
   * has an entry with a base URI corresponding to the given URI
   * @param {String} uri - the (maybe) prefixable URI
   * @returns {String} the (maybe) prefixed URI
   */
  toPrefixed (uri) {
    for (let [prefix, prefixedUri] of iterObj(this.prefixMap)) {
      if (uri.startsWith(prefixedUri)) {
        return `${prefix}:${uri.substr(prefixedUri.length)}`
      }
    }
    return uri
  }
}

/**
 * Converts a {@link module:rdf/node.Node} to a plain JSON-LD objectq to be included
 * in the response.
 * @param {module:rdf/node.Node} node
 */
function formatNode (node) {
  if (node == null) {
    return node
  }
  const { datatype, language, value } = node
  if (!datatype && !language) {
    return value
  }
  const formatted = { '@value': value }
  if (datatype) {
    formatted['@type'] = datatype.value
  }
  if (language) {
    formatted['@language'] = language.value
  }
  return formatted
}

export default query
