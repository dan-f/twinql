import Immutable from 'immutable'

import { GraphError } from '../errors'
import { Node, nodeSet } from './node'

/**
 * Provides functionality for dealing with RDF graphs.
 * @module
 */

/**
 * Type for a graph index
 * @typedef Index {external:Immutable.Map<external:Immutable.List<module:rdf/node.Node>, external:Immutable.Set<module:rdf/node.Node>>}
 */

/**
 * Implements an immutable RDF graph optimized for twinql querying patterns
 */
class Graph {
  /**
   * Creates a Graph with (subject, predicate), (predicate, object), and
   * (predicate, object, graph) indices.
   * @param {module:rdf/graph~Index} spIndex - the (subject, predicate) index
   * @param {module:rdf/graph~Index} poIndex - the (predicate, object) index
   * @param {module:rdf/graph~Index} pogIndex - the (predicate, object, graph) index
   * @param {external:Immutable.Set<module:rdf/quad~Quad>} quads - the set of quads
   */
  constructor (spIndex, poIndex, pogIndex, quads) {
    this.spIndex = spIndex || new Immutable.Map()
    this.poIndex = poIndex || new Immutable.Map()
    this.pogIndex = pogIndex || new Immutable.Map()
    this.quads = quads || new Immutable.Set()
  }

  /**
   * Construct a graph from a sequence of quads
   * @static
   * @param {Iterable<module:rdf/quad~Quad>} quads - the iterable sequence of quads
   * @returns {module:rdf/graph~Graph} the resulting graph
   */
  static fromQuads (quads) {
    let spIndex = Immutable.Map()
    let poIndex = Immutable.Map()
    let pogIndex = Immutable.Map()
    for (let { subject, predicate, object, graph } of quads) {
      spIndex = spIndex.update(Immutable.List([ subject, predicate ]), nodes =>
        nodes ? nodes.add(object) : nodeSet([object])
      )
      poIndex = poIndex.update(Immutable.List([ predicate, object ]), nodes =>
        nodes ? nodes.add(subject) : nodeSet([subject])
      )
      pogIndex = pogIndex.update(Immutable.List([ predicate, object, graph ]), nodes =>
        nodes ? nodes.add(subject) : nodeSet([subject])
      )
    }
    return new Graph(spIndex, poIndex, pogIndex, Immutable.Set(quads))
  }

  /**
   * Finds a set of nodes which match the given nodes.
   * - When given subject and predicate, gives all matching objects
   * - When given predicate and object, gives all matching subjects
   * - When given predicate, object, and graph, gives all matching subjects
   * @param {module:rdf/node.Node} subject - the subject
   * @param {module:rdf/node.Node} predicate - the predicate
   * @param {module:rdf/node.Node} object - the object
   * @param {module:rdf/node.Node} graph - the named graph
   * @returns {module:rdf/node.NodeSet} the matched nodes
   */
  match ({ subject, predicate, object, graph }) {
    if (subject && predicate) {
      return this.spIndex.get(Immutable.List([ subject, predicate ])) || nodeSet([])
    }
    if (predicate && object && !graph) {
      return this.poIndex.get(Immutable.List([ predicate, object ])) || nodeSet([])
    }
    if (predicate && object && graph) {
      return this.pogIndex.get(Immutable.List([ predicate, object, graph ])) || nodeSet([])
    }
    throw new GraphError(
      'Unsupported graph match.  ' +
      'Must provide either { subject, predicate } or { predicate, object[, graph] }'
    )
  }

  /**
   * Returns a new graph containing all the quads of this graph and the other
   * @param {module:rdf/graph~Graph} other - the other graph
   * @returns {module:rdf/graph~Graph} the unioned graph
   */
  union (other) {
    return new Graph(
      this.spIndex.mergeDeep(other.spIndex),
      this.poIndex.mergeDeep(other.poIndex),
      this.pogIndex.mergeDeep(other.pogIndex),
      this.quads.union(other.quads)
    )
  }
}

export default Graph
