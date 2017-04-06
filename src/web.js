import 'isomorphic-fetch'

import { HttpError } from './errors'
import Graph from './graph'
import { parseQuads } from './quad'

/**
 * Fetches a named graph over HTTP, parses the body, and returns the
 * corresponding graph
 * @param {String} graphName - the name (URI) of the graph to fetch
 * @returns {Promise<module:graph~Graph>} the fetched graph
 * @throws {module:errors~HttpError} An {@link module:errors~HttpError} may be
 * thrown if a non-2XX status code is returned
 */
export async function fetchGraph (graphName) {
  const response = await fetch(graphName, { headers: { 'accept': 'text/turtle' } }) // eslint-disable-line
    .then(throwIfBadStatus)
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
