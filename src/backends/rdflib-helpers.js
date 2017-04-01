import { NamedNode, Node as RdflibNode, Literal } from 'rdflib'

import { AST } from '../lang/ast'
import { Node } from '../node'

/**
 * Utilities for dealing with {@link external:rdflib}/rdf-ext APIs
 * @module
 */

/**
 * @external rdflib
 * @see https://github.com/linkeddata/rdflib.js/
 */

/**
 * @class Node
 * @memberof external:rdflib
 * @see https://github.com/linkeddata/rdflib.js/blob/master/src/node.js
 */

/**
 * @class IndexedFormula
 * @memberof external:rdflib
 * @see https://github.com/linkeddata/rdflib.js/blob/master/src/indexed-formula.js
 */

/**
 * Converts from {@link module:node~Node} to [rdflib.js Node]{@link external:rdflib.Node}
 *
 * @param {module:node~Node} node
 * @returns {external:rdflib.Node}
 */
export function toRdflibNode (node) {
  if (node instanceof RdflibNode) {
    return node
  }
  if (node instanceof Node) {
    switch (node.get('termType')) {
      case 'NamedNode':
        return NamedNode.fromValue(node.get('value'))
      case 'Literal':
      default:
        return Literal.fromValue(node.get('value'))
    }
  }
  throw new Error(`Cannot convert from unknown type ${node} to RDF node`)
}
