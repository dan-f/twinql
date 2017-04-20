import Backend from './backend'

/**
 * Implements a backend for a single in-memory graph.
 * @module
 */

/**
 * A backend for an in-memory graph
 * @extends {module:backends/backend~Backend}
 */
class InMemoryBackend extends Backend {
  /**
   * Create an InMemoryBackend
   * @param {module:rdf/graph~Graph} graph - the local graph
   */
  constructor (graph) {
    super()
    this.graph = graph
  }

  async getObjects (subject, predicate) {
    return this.graph.match({ subject, predicate })
  }

  async getSubjects (predicate, object, namedGraph) {
    return this.graph.match({
      predicate,
      object,
      graph: namedGraph || null
    })
  }
}

export default InMemoryBackend
