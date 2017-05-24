import Immutable from 'immutable'

/**
 * Provides functionality for dealing with RDF Quads.
 * @module
 */

/**
 * An Immutable.Record to represent RDF Quads
 * @class
 * @extends external:Immutable.Record
 */
const Quad = Immutable.Record({
  subject: null,
  predicate: null,
  object: null,
  graph: null
})

export default Quad
