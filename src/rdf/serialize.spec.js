/* eslint-env mocha */
import Immutable from 'immutable'

import Graph from './graph'
import { Node } from './node'
import { parseNQuads, serializeNQuads } from './serialize'
import Quad from './quad'

describe('serialize', () => {
  describe('parseNQuads', () => {
    const GRAPH = 'https://example.com/graph'

    it('rejects on a parse error', () => {
      const badN3 = 'missingPrefix:someone foaf:knows missingPrefix:someoneElse'
      return expect(parseNQuads(badN3, GRAPH))
        .to.eventually.be.rejectedWith(/Undefined prefix/)
    })

    it('parses an empty graph', () => {
      return expect(parseNQuads('', GRAPH))
        .to.eventually.be.an.instanceOf(Graph)
        .with.property('quads', Immutable.Set())
    })

    it('parses named nodes', () => {
      const n3 = `
        @prefix graph: <${GRAPH}#> .
        graph:thing graph:has graph:property .
      `
      return expect(parseNQuads(n3, GRAPH))
        .to.eventually.be.an.instanceOf(Graph)
        .then(g => {
          expect(g.quads).to.have.size(1)
          const quad = g.quads.first()
          expect(quad.get('subject'))
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(`${GRAPH}#thing`)
            .with.language(null)
            .with.datatype(null)
          expect(quad.get('predicate'))
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(`${GRAPH}#has`)
            .with.language(null)
            .with.datatype(null)
          expect(quad.get('object'))
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(`${GRAPH}#property`)
            .with.language(null)
            .with.datatype(null)
          expect(quad.get('graph'))
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(GRAPH)
            .with.language(null)
            .with.datatype(null)
        })
    })

    it('parses literals', () => {
      const n3 = `
        @prefix graph: <${GRAPH}#> .
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
        graph:person foaf:name "Person McPherson" .
      `
      return expect(parseNQuads(n3, GRAPH))
        .to.eventually.be.an.instanceOf(Graph)
        .then(g => {
          expect(g.quads).to.have.size(1)
          const quad = g.quads.first()
          expect(quad.get('subject'))
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(`${GRAPH}#person`)
            .with.language(null)
            .with.datatype(null)
          expect(quad.get('predicate'))
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value('http://xmlns.com/foaf/0.1/name')
            .with.language(null)
            .with.datatype(null)
          expect(quad.get('object'))
            .to.be.a.node
            .with.termType('Literal')
            .with.value('Person McPherson')
            .with.language(null)
            .with.datatype(null)
          expect(quad.get('graph'))
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(GRAPH)
            .with.language(null)
            .with.datatype(null)
        })
    })

    it('parses blank nodes', () => {
      const n3 = `
        [ a <http://xmlns.com/foaf/0.1/Person> ] .
      `
      return expect(parseNQuads(n3, GRAPH))
        .to.eventually.be.an.instanceOf(Graph)
        .then(g => {
          expect(g.quads).to.have.size(1)
          const quad = g.quads.first()
          expect(quad.get('subject'))
            .to.be.a.node
            .with.termType('BlankNode')
            .with.language(null)
            .with.datatype(null)
            .and.to.have.property('value')
          expect(quad.get('predicate'))
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
            .with.language(null)
            .with.datatype(null)
          expect(quad.get('object'))
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value('http://xmlns.com/foaf/0.1/Person')
            .with.language(null)
            .with.datatype(null)
          expect(quad.get('graph'))
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(GRAPH)
            .with.language(null)
            .with.datatype(null)
        })
    })
  })

  describe('serializeNQuads', () => {
    it('serializes an empty graph', () => {
      expect(serializeNQuads(new Graph()))
        .to.eventually.equal('')
    })

    it('serializes a quad', () => {
      const quads = [Quad({
        subject: Node({ termType: 'NamedNode', value: 'https://example.com/graph#subj' }),
        predicate: Node({ termType: 'NamedNode', value: 'https://example.com/vocab#term' }),
        object: Node({ termType: 'Literal', value: 'nice' }),
        graph: Node({ termType: 'NamedNode', value: 'https://example.com/graph' })
      })]
      expect(serializeNQuads(Graph.fromQuads(quads)))
        .to.eventually.equal(
          `<https://example.com/graph#subj> <https://example.com/vocab#term> "nice" <https://example.com/graph>.\n`
        )
    })

    it('serializes a literal with datatype', () => {
      const quads = [Quad({
        subject: Node({ termType: 'NamedNode', value: 'https://example.com/graph#subj' }),
        predicate: Node({ termType: 'NamedNode', value: 'https://example.com/vocab#term' }),
        object: Node({ termType: 'Literal', value: '123', datatype: 'http://www.w3.org/2001/XMLSchema#integer' }),
        graph: Node({ termType: 'NamedNode', value: 'https://example.com/graph' })
      })]
      expect(serializeNQuads(Graph.fromQuads(quads)))
        .to.eventually.equal(
          `<https://example.com/graph#subj> <https://example.com/vocab#term> "123"^^<http://www.w3.org/2001/XMLSchema#integer> <https://example.com/graph>.\n`
        )
    })

    it('serializes a literal with language', () => {
      const quads = [Quad({
        subject: Node({ termType: 'NamedNode', value: 'https://example.com/graph#subj' }),
        predicate: Node({ termType: 'NamedNode', value: 'https://example.com/vocab#term' }),
        object: Node({ termType: 'Literal', value: 'hola', language: 'es' }),
        graph: Node({ termType: 'NamedNode', value: 'https://example.com/graph' })
      })]
      expect(serializeNQuads(Graph.fromQuads(quads)))
        .to.eventually.equal(
          `<https://example.com/graph#subj> <https://example.com/vocab#term> "hola"@es <https://example.com/graph>.\n`
        )
    })
  })
})
