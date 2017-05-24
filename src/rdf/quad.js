/**
 * Provides functionality for dealing with RDF Quads.
 * @module
 */

/**
 * Type for a quad
 * @typedef Quad {Object}
 * @property {module:rdf/node.Node} subject - the subject of the quad
 * @property {module:rdf/node.Node} predicate - the predicate of the quad
 * @property {module:rdf/node.Node} object - the object of the quad
 * @property {module:rdf/node.Node} graph - the graph of the quad; a NamedNode
 * representing the named graph this quad belongs to
 */

/**
 * Parses a list of quads from a text buffer.  Currently assumes the buffer is
 * in N3.
 * @param {String} graphName - the name of the graph (the URI of the graph)
 * @param {String} text - the text of the graph in N3
 * @returns {Promise<Iterable<module:rdf/quad~Quad>>} an iterable of parsed quads
 */
