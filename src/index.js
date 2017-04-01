import query from './query'
import InMemoryBackend from './backends/in-memory-backend'
import LdpBackend from './backends/ldp-backend'

/**
 * The main entrypoint. Exports the query function and available backends.
 * @module
 */

export { query, InMemoryBackend, LdpBackend }
