import rdflib, { IndexedFormula } from 'rdflib'
import { SolidWebClient } from 'solid-web-client'

import InMemoryBackend from './in-memory-backend'
import { toRdflibNode } from './rdflib-helpers'

/**
 * Implements a backend which follows links in a [Linked Data Platform]{@link https://www.w3.org/TR/ldp/}
 * network.
 * @module
 */

/**
 * A backend for the semantic web where each webserver is assumed to implement
 * the [Linked Data Platform spec]{@link https://www.w3.org/TR/ldp/}
 * @extends {module:backends/in-memory-backend~InMemoryBackend}
 */
class LdpBackend extends InMemoryBackend {
  /**
   * Create an LdpBackend
   * @param {external:rdflib.IndexedFormula} [store = new {@link external:rdflib.IndexedFormula}] -
   */
  constructor (store = new IndexedFormula()) {
    super(store)
    this.webClient = new SolidWebClient(rdflib)
    this.lockedGraphs = new Set()
    this.on('queryDone', () => this.lockedGraphs.clear())
  }

  async getObjects (subject, predicate) {
    await this.ensureGraphLoaded(getNamedGraph(subject))
    return super.getObjects(subject, predicate)
  }

  async getSubjects (predicate, object, namedGraph) {
    if (namedGraph) {
      await this.ensureGraphLoaded(getNamedGraph(namedGraph))
    }
    return super.getSubjects(predicate, object, namedGraph)
  }

  /**
   * Load the named graph for the given node's url (if not already loaded) into the
   * backend's graph store.
   * @param {String} namedGraph
   */
  async ensureGraphLoaded (namedGraph) {
    if (!namedGraph) {
      return false
    }
    if (this.lockedGraphs.has(namedGraph)) {
      return true
    }
    const graph = (await this.webClient.get(namedGraph)).parsedGraph()
    this.lockedGraphs.add(namedGraph)
    this.store.addAll(graph.statements)
    return true
  }
}

/**
 * Gets the resource url for an RDF node.
 * @param {external:rdflib.Node} node
 * @returns {String} the url to the given resource
 */
function getNamedGraph (node) {
  return node.termType === 'NamedNode'
    ? node.value.split('#')[0]
    : null
}

export default LdpBackend
