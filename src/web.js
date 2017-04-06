import 'isomorphic-fetch'

import { HttpError } from './errors'
import Graph from './rdf/graph'
import { parseQuads } from './rdf/quad'

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
    response = await fetch(graphName, { headers: { 'accept': 'text/turtle' } }) // eslint-disable-line
      .then(throwIfBadStatus)
  } catch (e) {
    throw e.name === 'HttpError'
      ? e
      : new HttpError({ statusText: e.message, status: 0 })
  }
  const text = await response.text()
  return Graph.fromQuads(await parseQuads(graphName, text))
}

function throwIfBadStatus (response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    throw new HttpError(response)
  }
}
