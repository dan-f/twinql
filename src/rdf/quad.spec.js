/* eslint-env mocha */

import { parseQuads } from './quad'

describe('quad', () => {
  describe('parseQuads', () => {
    const GRAPH = 'https://example.com/graph'

    it('rejects on a parse error', () => {
      const badN3 = 'missingPrefix:someone foaf:knows missingPrefix:someoneElse'
      return expect(parseQuads(GRAPH, badN3))
        .to.eventually.be.rejectedWith(/Undefined prefix/)
    })

    it('parses an empty graph', () => {
      return expect(parseQuads(GRAPH, ''))
        .to.eventually.be.an('array')
        .and.to.be.empty
    })

    it('parses named nodes', () => {
      const n3 = `
        @prefix graph: <${GRAPH}#> .
        graph:thing graph:has graph:property .
      `
      return expect(parseQuads(GRAPH, n3))
        .to.eventually.be.an('array').with.lengthOf(1)
        .then(([ { subject, predicate, object, graph } ]) => {
          expect(subject)
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(`${GRAPH}#thing`)
            .with.language(null)
            .with.datatype(null)
          expect(predicate)
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(`${GRAPH}#has`)
            .with.language(null)
            .with.datatype(null)
          expect(object)
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(`${GRAPH}#property`)
            .with.language(null)
            .with.datatype(null)
          expect(graph)
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
      return expect(parseQuads(GRAPH, n3))
        .to.eventually.be.an('array').with.lengthOf(1)
        .then(([ { subject, predicate, object, graph } ]) => {
          expect(subject)
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(`${GRAPH}#person`)
            .with.language(null)
            .with.datatype(null)
          expect(predicate)
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value('http://xmlns.com/foaf/0.1/name')
            .with.language(null)
            .with.datatype(null)
          expect(object)
            .to.be.a.node
            .with.termType('Literal')
            .with.value('Person McPherson')
            .with.language(null)
            .with.datatype(null)
          expect(graph)
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
      return expect(parseQuads(GRAPH, n3))
        .to.eventually.be.an('array').with.lengthOf(1)
        .then(([ { subject, predicate, object, graph } ]) => {
          expect(subject)
            .to.be.a.node
            .with.termType('BlankNode')
            .with.language(null)
            .with.datatype(null)
            .and.to.have.property('value')
          expect(predicate)
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
            .with.language(null)
            .with.datatype(null)
          expect(object)
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value('http://xmlns.com/foaf/0.1/Person')
            .with.language(null)
            .with.datatype(null)
          expect(graph)
            .to.be.a.node
            .with.termType('NamedNode')
            .with.value(GRAPH)
            .with.language(null)
            .with.datatype(null)
        })
    })
  })
})
