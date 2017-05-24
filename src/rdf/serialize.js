import N3 from 'n3'

import Graph from './graph'
import { Node } from './node'
import Quad from './quad'
import { iterObj } from '../util'

const STR_TYPE = 'http://www.w3.org/2001/XMLSchema#string'

/**
 * Parses a list of quads from a text buffer.  Currently assumes the buffer is
 * in N3.
 * @param {String} text - the text of the graph in N3
 * @param {String} [graphName] - the name of the graph (the URI of the graph)
 * @returns {Promise<module:rdf/graph.Graph>} a graph from the parsed quads
 */
export function parseNQuads (text, graphName = null) {
  return new Promise((resolve, reject) => {
    const parser = graphName
      ? N3.Parser({ documentIRI: graphName })
      : N3.Parser()
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
        if (graphName && !newQuad.graph) {
          newQuad.graph = Node({ termType: 'NamedNode', value: graphName })
        }
        quads.push(Quad(newQuad))
      } else {
        resolve(Graph.fromQuads(quads))
      }
    })
  })
}

/**
 * Serializes a graph to N-Quads (N-Triples)
 *
 * @param {module:rdf/graph.Graph} graph - the graph to serialize
 * @returns {Promise<String>} - the graph serialized to N-Quads
 */
export function serializeNQuads (graph) {
  return new Promise((resolve, reject) => {
    const { quads } = graph
    // same as n-quads as far as n3.js is concerned
    const writer = N3.Writer({ format: 'N-Triples' })
    quads.forEach(quad =>
      writer.addTriple(
        toNQuadTerm(quad.get('subject')),
        toNQuadTerm(quad.get('predicate')),
        toNQuadTerm(quad.get('object')),
        quad.get('graph') ? toNQuadTerm(quad.get('graph')) : undefined
      )
    )
    writer.end((err, results) => {
      if (err) { reject(err) }
      resolve(results)
    })
  })
}

/**
 * Serializes a node to it's N-Quads representation.
 *
 * @param {module:rdf/graph}
 */
const toNQuadTerm = term => {
  switch (term.get('termType')) {
    case 'NamedNode':
      return term.get('value')
    case 'Literal':
      const serialized = `"${term.get('value')}"`
      if (term.get('datatype')) {
        return serialized + '^^' + term.get('datatype')
      }
      if (term.get('language')) {
        return serialized + '@' + term.get('language')
      }
      return serialized
  }
}
