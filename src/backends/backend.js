import { AbstractClassError, NotImplementedError } from '../errors'

/**
 * A backend is an interface for the query engine to speak to a quadstore.  It
 * abstracts away the particular details of where the data is stored, and what
 * interface that data store implements from the query engine.
 *
 * Because the data may exist remotely, all operations return Promises.
 * @module
 */

/**
 * The abstract interface which all backends must implement
 */
class Backend {
  constructor () {
    this.eventHandlers = {}
  }

  get className () {
    return this.constructor.name
  }

  /**
   * Get all nodes pointed to by the given subject and predicate.
   * @param {module:node~Node} subject
   * @param {module:node~Node} predicate
   * @returns {Promise<module:node~NodeSet>}
   */
  async getObjects (subject, predicate) {
    throw new NotImplementedError('getObjects', this.className)
  }

  /**
   * Get all subject nodes pointing to the given object by the given predicate
   * from the given named graph.
   * @param {module:node~Node} predicate
   * @param {module:node~Node} object
   * @param {module:node~Node} namedGraph
   * @returns {Promise<module:node~NodeSet>}
   */
  async getSubjects (predicate, object, namedGraph) {
    throw new NotImplementedError('getSubjects', this.className)
  }

  on (eventName, handler) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName].push(handler)
    } else {
      this.eventHandlers[eventName] = [handler]
    }
  }

  trigger (eventName) {
    return (this.eventHandlers[eventName] || [])
      .map(cb => cb.call(this))
  }
}

export default Backend
