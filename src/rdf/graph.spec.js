/* eslint-env mocha */
import Immutable from 'immutable'

import Graph from './graph'
import { Node, nodeSet } from './node'

describe('graph', () => {
  describe('Graph', () => {
    const GRAPH = 'https://example.com/graph'

    it('is immutable', () => {
      const graph = Graph.fromQuads([])
      expect(graph.spIndex).to.be.an.instanceof(Immutable.Map)
      expect(graph.poIndex).to.be.an.instanceof(Immutable.Map)
      expect(graph.pogIndex).to.be.an.instanceof(Immutable.Map)
    })

    it('can be constructed from an iterable of quads', () => {
      const quad = {
        subject: Node({ termType: 'NamedNode', value: `${GRAPH}#subj`, language: null, datatype: null }),
        predicate: Node({ termType: 'NamedNode', value: `${GRAPH}#is`, language: null, datatype: null }),
        object: Node({ termType: 'Literal', value: 'foo', language: null, datatype: null }),
        graph: Node({ termType: 'NamedNode', value: GRAPH, language: null, datatype: null })
      }
      const graph = Graph.fromQuads([quad])
      expect(graph)
        .index('spIndex').to.map(quad.subject, quad.predicate).to.nodes([quad.object])
        .index('poIndex').to.map(quad.predicate, quad.object).to.nodes([quad.subject])
        .index('pogIndex').to.map(quad.predicate, quad.object, quad.graph).to.nodes([quad.subject])
      expect(graph.quads).to.eql(Immutable.Set.of(Immutable.fromJS(quad)))
    })

    it('can union with another graph', () => {
      const subject = Node({ termType: 'NamedNode', value: `${GRAPH}#subj`, language: null, datatype: null })
      const graph = Node({ termType: 'NamedNode', value: GRAPH, language: null, datatype: null })
      const quad1 = {
        subject,
        predicate: Node({ termType: 'NamedNode', value: `${GRAPH}#is`, language: null, datatype: null }),
        object: Node({ termType: 'Literal', value: 'foo', language: null, datatype: null }),
        graph
      }
      const quad2 = {
        subject,
        predicate: Node({ termType: 'NamedNode', value: `${GRAPH}#isAlso`, language: null, datatype: null }),
        object: Node({ termType: 'Literal', value: 'bar', language: null, datatype: null }),
        graph
      }
      const graph1 = Graph.fromQuads([quad1])
      const graph2 = Graph.fromQuads([quad2])
      const unioned = graph1.union(graph2)
      expect(unioned)
        .index('spIndex').to.map(subject, quad1.predicate).to.nodes([quad1.object])
        .index('spIndex').to.map(subject, quad2.predicate).to.nodes([quad2.object])
        .index('poIndex').to.map(quad1.predicate, quad1.object).to.nodes([subject])
        .index('poIndex').to.map(quad2.predicate, quad2.object).to.nodes([subject])
        .index('pogIndex').to.map(quad1.predicate, quad1.object, graph).to.nodes([subject])
        .index('pogIndex').to.map(quad2.predicate, quad2.object, graph).to.nodes([subject])
      expect(unioned.quads).to.eql(Immutable.Set([
        Immutable.fromJS(quad1),
        Immutable.fromJS(quad2)
      ]))
    })

    describe('matching', () => {
      it('can find all objects based on subject and predicate', () => {
        const subject = Node({ termType: 'NamedNode', value: `${GRAPH}#subj`, language: null, datatype: null })
        const predicate = Node({ termType: 'NamedNode', value: `${GRAPH}#is`, language: null, datatype: null })
        const object = Node({ termType: 'Literal', value: 'foo', language: null, datatype: null })
        const graph = Node({ termType: 'NamedNode', value: GRAPH, language: null, datatype: null })
        const quad = { subject, predicate, object, graph }
        expect(Graph.fromQuads([quad]).match({ subject, predicate }))
          .to.equal(nodeSet([object]))
      })

      it('can find all subjects based on predicate and object', () => {
        const subject = Node({ termType: 'NamedNode', value: `${GRAPH}#subj`, language: null, datatype: null })
        const predicate = Node({ termType: 'NamedNode', value: `${GRAPH}#is`, language: null, datatype: null })
        const object = Node({ termType: 'Literal', value: 'foo', language: null, datatype: null })
        const graph = Node({ termType: 'NamedNode', value: GRAPH, language: null, datatype: null })
        const quad = { subject, predicate, object, graph }
        expect(Graph.fromQuads([quad]).match({ predicate, object }))
          .to.equal(nodeSet([subject]))
      })

      it('can find all subjects based on predicate, object, and graph', () => {
        const subject = Node({ termType: 'NamedNode', value: `${GRAPH}#subj`, language: null, datatype: null })
        const predicate = Node({ termType: 'NamedNode', value: `${GRAPH}#is`, language: null, datatype: null })
        const object = Node({ termType: 'Literal', value: 'foo', language: null, datatype: null })
        const graph = Node({ termType: 'NamedNode', value: GRAPH, language: null, datatype: null })
        const quad = { subject, predicate, object, graph }
        expect(Graph.fromQuads([quad]).match({ predicate, object, graph }))
          .to.equal(nodeSet([subject]))
      })

      it(`returns an empty node set when it can't find any match`, () => {
        const subject = Node({ termType: 'NamedNode', value: `${GRAPH}#subj`, language: null, datatype: null })
        const predicate = Node({ termType: 'NamedNode', value: `${GRAPH}#is`, language: null, datatype: null })
        const object = Node({ termType: 'Literal', value: 'foo', language: null, datatype: null })
        const graph = Node({ termType: 'NamedNode', value: GRAPH, language: null, datatype: null })
        const quad = { subject, predicate, object, graph }
        expect(Graph.fromQuads([quad]).match({ subject: {}, predicate: {} }))
          .to.equal(nodeSet())
      })

      it(`doesn't match for unsupported patterns`, () => {
        expect(() => Graph.fromQuads([]).match({ subject: {}, object: {} }))
          .to.throw(/Unsupported graph match/)
      })
    })
  })
})
