import Immutable from 'immutable'

import { GraphError } from './errors'
import { nodeSet } from './node'

/**
 * Provides functionality for dealing with RDF graphs.
 * @module
 */

/**
 * Type for a graph index
 * @typedef Index {external:Immutable.Map<external:Immutable.List<module:node.Node>, external:Immutable.Set<module:node.Node>>}
 */

/**
 * Implements an immutable RDF graph optimized for twinql querying patterns
 */
class Graph {
  /**
   * Creates a Graph with (subject, predicate), (predicate, object), and
   * (predicate, object, graph) indices.
   * @param {module:graph~Index} spIndex - the (subject, predicate) index
   * @param {module:graph~Index} poIndex - the (predicate, object) index
   * @param {module:graph~Index} pogIndex - the (predicate, object, graph) index
   */
  constructor (spIndex, poIndex, pogIndex) {
    this.spIndex = spIndex || new Immutable.Map()
    this.poIndex = poIndex || new Immutable.Map()
    this.pogIndex = pogIndex || new Immutable.Map()
  }

  /**
   * Construct a graph from a sequence of quads
   * @static
   * @param {Iterable<module:quad~Quad>} quads - the iterable sequence of quads
   * @returns {module:graph~Graph} the resulting graph
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
    return new Graph(spIndex, poIndex, pogIndex)
  }

  /**
   * Finds a set of nodes which match the given nodes.
   * - When given subject and predicate, gives all matching objects
   * - When given predicate and object, gives all matching subjects
   * - When given predicate, object, and graph, gives all matching subjects
   * @param {module:node.Node} subject - the subject
   * @param {module:node.Node} predicate - the predicate
   * @param {module:node.Node} object - the object
   * @param {module:node.Node} graph - the named graph
   * @returns {module:node.NodeSet} the matched nodes
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
   * @param {module:graph~Graph} other - the other graph
   * @returns {module:graph~Graph} the unioned graph
   */
  union (other) {
    return new Graph(
      this.spIndex.mergeDeep(other.spIndex),
      this.poIndex.mergeDeep(other.poIndex),
      this.pogIndex.mergeDeep(other.pogIndex)
    )
  }
}

export default Graph
