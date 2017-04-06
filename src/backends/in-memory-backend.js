import Backend from './backend'
import { toRdflibNode } from './rdflib-helpers'
import { nodeSet } from '../node'

/**
 * Implements a backend for a single in-memory graph store.
 * @module
 */

/**
 * A backend for an in-memory graph
 * @extends {module:backends/backend~Backend}
 */
class InMemoryBackend extends Backend {
  /**
   * Create an InMemoryBackend
   * @param {external:rdflib.IndexedFormula} store - the local graph
   */
  constructor (store) {
    super()
    this.store = store
  }

  async getObjects (subject, predicate) {
    if (predicate == null) debugger
    return nodeSet(
      this.store.match(toRdflibNode(subject), toRdflibNode(predicate))
        .map(st => st.object)
    )
  }

  async getSubjects (predicate, object, namedGraph) {
    return nodeSet(
      this.store.match(
        null,
        toRdflibNode(predicate),
        toRdflibNode(object),
        namedGraph ? toRdflibNode(namedGraph) : null
      ).map(st => st.subject)
    )
  }
}

export default InMemoryBackend
