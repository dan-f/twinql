import 'isomorphic-fetch'

import { HttpError, RdfParseError } from './errors'
import Graph from './rdf/graph'
import { parseQuads } from './rdf/quad'

const TIMEOUT = 5000

/**
 * Fetches a named graph over HTTP, parses the body, and returns the
 * corresponding graph
 * @param {String} graphName - the name (URI) of the graph to fetch
 * @returns {Promise<module:rdf/graph~Graph>} the fetched graph
 * @throws {module:errors~HttpError} An {@link module:errors~HttpError} may be
 * thrown if a non-2XX status code is returned
 */
export async function fetchGraph (graphName) {
  let response
  try {
    response = await Promise.race([
      fetch(graphName, { headers: { 'accept': 'text/turtle' } }).then(throwIfBadStatus), // eslint-disable-line
      new Promise((resolve, reject) => setTimeout(() => reject(new Error('Request timed out')), TIMEOUT))
    ])
  } catch (e) {
    throw e.name === 'HttpError'
      ? e
      : new HttpError({ statusText: e.message, status: 0 })
  }
  const text = await response.text()
  try {
    return Graph.fromQuads(await parseQuads(graphName, text))
  } catch (e) {
    throw new RdfParseError(e.message)
  }
}

function throwIfBadStatus (response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    throw new HttpError(response)
  }
}