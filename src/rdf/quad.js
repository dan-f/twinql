import N3 from 'n3'

import { Node } from './node'
import { iterObj } from '../util'

const STR_TYPE = 'http://www.w3.org/2001/XMLSchema#string'

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
export function parseQuads (graphName, text) {
  return new Promise((resolve, reject) => {
    const parser = N3.Parser({ documentIRI: graphName })
    const quads = []
    parser.parse(text, function (error, quad) {
      if (error) { reject(error) }
      if (quad) {
        const newQuad = {}
        for (let [whichNode, n3NodeText] of iterObj(quad)) {
          let nodeVal
          if (N3.Util.isIRI(n3NodeText)) {
            nodeVal = Node({ termType: 'NamedNode', value: n3NodeText })
          } else if (N3.Util.isLiteral(n3NodeText)) {
            const language = (N3.Util.getLiteralLanguage(n3NodeText))
            const datatype = (N3.Util.getLiteralType(n3NodeText))
            const metaData = {
              language: language || null,
              datatype: datatype !== STR_TYPE
                ? datatype
                : null
            }
            nodeVal = Node({ termType: 'Literal', value: N3.Util.getLiteralValue(n3NodeText), ...metaData })
          } else if (N3.Util.isBlank(n3NodeText)) {
            nodeVal = Node({ termType: 'BlankNode', value: n3NodeText })
          }
          newQuad[whichNode] = nodeVal
        }
        if (!newQuad.graph) {
          newQuad.graph = Node({ termType: 'NamedNode', value: graphName })
        }
        quads.push(newQuad)
      }
      resolve(quads)
    })
  })
}
