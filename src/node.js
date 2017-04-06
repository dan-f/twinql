import Immutable from 'immutable'

/**
 * Provides immutable datatypes for dealing with RDF nodes.
 * @module
 */

/**
 * @external Immutable
 * @see https://facebook.github.io/immutable-js/docs/#/
 */

/**
 * @class Set
 * @memberof external:Immutable
 * @see https://facebook.github.io/immutable-js/docs/#/Set
 */

/**
 * @class Record
 * @memberof external:Immutable
 * @see https://facebook.github.io/immutable-js/docs/#/Record
 */

/**
 * A union type for nodes in the graph
 * @typedef {(module:parsetree.Uri|module:parsetree.StringLiteral|module:node.NodeRecord)} NodeLike
 */

/**
 * An immutable set of Nodes
 * @typedef NodeSet {external:Immutable.Set<module:node.NodeRecord>}
 */

/**
 * An Immutable.Record to represent RDF Nodes
 * @class
 * @extends external:Immutable.Record
 */
export const Node = Immutable.Record({
  termType: '',
  value: '',
  language: '',
  datatype: ''
})

/**
 * Constructs an {@link external:Immutable.Set} of {@link module:node.NodeRecord}s.
 *
 * @param {Array<module:node.NodeLike>} [nodes=[]] - A list of RDF Nodes
 * @return {NodeSet} the set of nodes
 */
export function nodeSet (nodes = []) {
  return Immutable.Set(nodes.map(Node))
}
