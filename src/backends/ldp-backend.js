import Graph from '../rdf/graph'
import InMemoryBackend from './in-memory-backend'
import { fetchGraph } from '../web'

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
   * @param {module:rdf/graph~Graph} [graph = new {@link module:rdf/graph~Graph}]
   * @param {Object} options - options object
   * @param {String} [options.proxyUri=''] - the URI of a Solid agent used for fetching LDP resources
   * @param {Object} [options.headers={}] - headers to send with each LDP request
   */
  constructor ({ graph = new Graph(), proxyUri = '', headers = {} }) {
    super(graph)
    this.proxyUri = proxyUri
    this.headers = headers
    this.lockedGraphs = new Set()
    this.on('queryDone', () => this.lockedGraphs.clear())
  }

  async getObjects (subject, predicate) {
    await this.ensureGraphLoaded(getGraphName(subject))
    return super.getObjects(subject, predicate)
  }

  async getSubjects (predicate, object, graphName) {
    if (graphName) {
      await this.ensureGraphLoaded(getGraphName(graphName))
    }
    return super.getSubjects(predicate, object, graphName)
  }

  /**
   * Load the named graph for the given node's url (if not already loaded) into the
   * backend's graph graph.
   * @param {String} graphName
   */
  async ensureGraphLoaded (graphName) {
    if (!graphName) {
      return false
    }
    if (this.lockedGraphs.has(graphName)) {
      return true
    }
    const graph = await fetchGraph(graphName, this.proxyUri, this.headers)
    this.graph = this.graph.union(graph)
    this.lockedGraphs.add(graphName)
    return true
  }
}

/**
 * Gets the resource url for an RDF node.
 * @param {module:rdf/node.Node} node
 * @returns {String} the url to the given resource
 */
function getGraphName (node) {
  return node.termType === 'NamedNode'
    ? node.value.split('#')[0]
    : null
}

export default LdpBackend
