import 'isomorphic-fetch'

import { HttpError, RdfParseError } from './errors'
import { parseNQuads } from './rdf/serialize'

const TIMEOUT = 5000

/**
 * Fetches a named graph over HTTP, parses the body, and returns the
 * corresponding graph
 * @param {String} graphName - the name (URI) of the graph to fetch
 * @param {String} [proxyUri=''] - the URI of a Solid agent
 * @param {Object} headers - headers to add to the request
 * @returns {Promise<module:rdf/graph~Graph>} the fetched graph
 * @throws {module:errors~HttpError} An {@link module:errors~HttpError} may be
 * thrown if a non-2XX status code is returned
 */
export async function fetchGraph (graphName, { proxyUri = '', headers = {}, timeout = TIMEOUT } = {}) {
  let response
  try {
    response = await Promise.race([
      fetch(proxyUri + graphName, { headers: {...headers, 'accept': 'text/turtle' } }) // eslint-disable-line
        .then(throwIfBadStatus),
      new Promise((resolve, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
    ])
  } catch (e) {
    throw e.name === 'HttpError'
      ? e
      : new HttpError({ statusText: e.message, status: 0 })
  }
  const text = await response.text()
  try {
    return parseNQuads(text, graphName)
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
