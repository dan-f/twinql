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
      this.store.statementsMatching(
        null,
        toRdflibNode(predicate),
        toRdflibNode(object),
        namedGraph ? toRdflibNode(namedGraph) : null
      ).map(st => st.subject)
    )
  }

  async getNodesByValue (value) {
    const node = toRdflibNode(value)
    const subjectsMatching = this.store.match(node).map(st => st.subject)
    const objectsMatching = this.store.match(null, null, node).map(st => st.object)
    return nodeSet(subjectsMatching.concat(objectsMatching))
  }
}

export default InMemoryBackend
