import query from './query'
import Backend from './backends/backend'
import InMemoryBackend from './backends/in-memory-backend'
import WebBackend from './backends/web-backend'

/**
 * The main entrypoint. Exports the query function and available backends.
 * @module
 */

export { query, Backend, InMemoryBackend, WebBackend }
