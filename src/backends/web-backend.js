import Graph from '../rdf/graph'
import InMemoryBackend from './in-memory-backend'
import { fetchGraph } from '../web'

/**
 * Implements a backend which follows links on the web.
 * @module
 */

/**
 * A backend for the semantic web where each web page is considered a named
 * graph that can be dereferenced over HTTP.
 * @extends {module:backends/in-memory-backend~InMemoryBackend}
 */
class WebBackend extends InMemoryBackend {
  /**
   * Create an WebBackend
   * @param {module:rdf/graph~Graph} [graph = new {@link module:rdf/graph~Graph}]
   * @param {Object} options - options object
   * @param {String} [options.proxyUri=''] - the URI of a Solid agent used for
   *     fetching RDF resources
   * @param {Object} [options.headers={}] - headers to send with each request
   */
  constructor ({ graph = new Graph(), proxyUri = '', headers = {} } = {}) {
    super(graph)
    this.proxyUri = proxyUri
    this.headers = headers
    this.loadingGraphs = {}
    this.on('queryDone', () => { this.loadingGraphs = {} })
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
   * Load the named graph for the given node's URL (if not already loaded)
   * into the backend's graph graph.
   * @param {String} graphName
   */
  async ensureGraphLoaded (graphName) {
    if (!graphName) {
      return false
    }
    if (this.loadingGraphs[graphName]) {
      return this.loadingGraphs[graphName]
    }
    const { proxyUri, headers } = this
    this.loadingGraphs[graphName] = fetchGraph(graphName, { proxyUri, headers })
      .then(graph => {
        this.graph = this.graph.union(graph)
      })
    return this.loadingGraphs[graphName]
  }
}

/**
 * Gets the resource URL for an RDF node.
 * @param {module:rdf/node.Node} node
 * @returns {String} the URL to the given resource
 */
function getGraphName (node) {
  return node.termType === 'NamedNode'
    ? node.value.split('#')[0]
    : null
}

export default WebBackend
