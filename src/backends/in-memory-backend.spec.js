/* eslint-env mocha */
import Graph from '../rdf/graph'
import { Node, nodeSet } from '../rdf/node'
import InMemoryBackend from './in-memory-backend'

describe('in-memory-backend', () => {
  describe('InMemoryBackend', () => {
    it('finds objects based on subject and predicate', () => {
      const GRAPH = 'https://example.com/graph'
      const subject = Node({ termType: 'NamedNode', value: `${GRAPH}#subj`, language: null, datatype: null })
      const predicate = Node({ termType: 'NamedNode', value: `${GRAPH}#is`, language: null, datatype: null })
      const object = Node({ termType: 'Literal', value: 'foo', language: null, datatype: null })
      const graph = Node({ termType: 'NamedNode', value: GRAPH, language: null, datatype: null })
      const backend = new InMemoryBackend(Graph.fromQuads([{ subject, predicate, object, graph }]))
      return expect(backend.getObjects(subject, predicate))
        .to.eventually.equal(nodeSet([object]))
    })

    it('finds subjects based on object and predicate', () => {
      const GRAPH = 'https://example.com/graph'
      const subject = Node({ termType: 'NamedNode', value: `${GRAPH}#subj`, language: null, datatype: null })
      const predicate = Node({ termType: 'NamedNode', value: `${GRAPH}#is`, language: null, datatype: null })
      const object = Node({ termType: 'Literal', value: 'foo', language: null, datatype: null })
      const graph = Node({ termType: 'NamedNode', value: GRAPH, language: null, datatype: null })
      const backend = new InMemoryBackend(Graph.fromQuads([{ subject, predicate, object, graph }]))
      return expect(backend.getSubjects(predicate, object))
        .to.eventually.equal(nodeSet([subject]))
    })

    it('finds subjects based on object, predicate, and graph', () => {
      const GRAPH = 'https://example.com/graph'
      const subject = Node({ termType: 'NamedNode', value: `${GRAPH}#subj`, language: null, datatype: null })
      const predicate = Node({ termType: 'NamedNode', value: `${GRAPH}#is`, language: null, datatype: null })
      const object = Node({ termType: 'Literal', value: 'foo', language: null, datatype: null })
      const graph = Node({ termType: 'NamedNode', value: GRAPH, language: null, datatype: null })
      const backend = new InMemoryBackend(Graph.fromQuads([{ subject, predicate, object, graph }]))
      return expect(backend.getSubjects(predicate, object, graph))
        .to.eventually.equal(nodeSet([subject]))
    })
  })
})
