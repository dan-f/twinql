/* eslint-env mocha */
import nock from 'nock'
import proxyquire from 'proxyquire'
import { spy } from 'sinon'

import { Node, nodeSet } from '../rdf/node'
import { fetchGraph } from '../web'

import aliceTtl from '../../test/alice'

describe('web-backend', () => {
  describe('WebBackend', () => {
    let WebBackend
    let fetchGraphSpy

    beforeEach(() => {
      fetchGraphSpy = spy(fetchGraph)
      WebBackend = proxyquire('./web-backend', {
        '../web': { fetchGraph: fetchGraphSpy }
      }).default
    })

    afterEach(() => {
      nock.cleanAll()
    })

    describe('getObjects', () => {
      it('loads the graph of the given subject before finding the objects', () => {
        nock('https://alice.com/')
          .get('/graph')
          .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

        const backend = new WebBackend()
        const alice = Node({ termType: 'NamedNode', value: 'https://alice.com/graph#alice' })
        const knows = Node({ termType: 'NamedNode', value: 'http://xmlns.com/foaf/0.1/knows' })
        const bob = Node({ termType: 'NamedNode', value: 'https://bob.com/graph#bob' })
        const spot = Node({ termType: 'NamedNode', value: 'https://alice.com/graph#spot' })
        return expect(backend.getObjects(alice, knows))
          .to.eventually.equal(nodeSet([bob, spot]))
      })
    })

    describe('getSubjects', () => {
      it('loads the graph, if provided, before finding the subjects', () => {
        nock('https://alice.com/')
          .get('/graph')
          .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

        const backend = new WebBackend()
        const graphName = 'https://alice.com/graph'
        const alice = Node({ termType: 'NamedNode', value: `${graphName}#alice` })
        const knows = Node({ termType: 'NamedNode', value: 'http://xmlns.com/foaf/0.1/knows' })
        const bob = Node({ termType: 'NamedNode', value: 'https://bob.com/graph#bob' })
        const graph = Node({ termType: 'NamedNode', value: graphName })
        return expect(backend.getSubjects(knows, bob, graph))
          .to.eventually.equal(nodeSet([alice]))
      })

      it('does not load any graph if none is provided', () => {
        const backend = new WebBackend()
        const knows = Node({ termType: 'NamedNode', value: 'http://xmlns.com/foaf/0.1/knows' })
        const bob = Node({ termType: 'NamedNode', value: 'https://bob.com/graph#bob' })
        return expect(backend.getSubjects(knows, bob))
          .to.eventually.equal(nodeSet())
      })
    })

    describe('ensureGraphLoaded', () => {
      it('loads a graph which has not yet been loaded', () => {
        nock('https://alice.com/')
          .get('/graph')
          .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

        const graphName = 'https://alice.com/graph'
        const backend = new WebBackend()
        expect(backend.loadedGraphs).not.to.haveMember(graphName)
        return expect(backend.ensureGraphLoaded(graphName)).to.eventually.be.true
          .then(() => {
            expect(backend.loadedGraphs).to.haveMember(graphName)
            const alice = Node({ termType: 'NamedNode', value: `${graphName}#alice` })
            const knows = Node({ termType: 'NamedNode', value: 'http://xmlns.com/foaf/0.1/knows' })
            const bob = Node({ termType: 'NamedNode', value: 'https://bob.com/graph#bob' })
            const spot = Node({ termType: 'NamedNode', value: 'https://alice.com/graph#spot' })
            expect(backend.graph.match({ subject: alice, predicate: knows}))
              .to.equal(nodeSet([bob, spot]))
            expect(fetchGraphSpy).to.have.been.calledOnce
          })
      })

      it('resets the list of loaded graphs at the end of a query', () => {
        const backend = new WebBackend()
        const graphName = 'https://example.com/graph'
        backend.loadedGraphs.add(graphName)
        backend.trigger('queryDone')
        expect(backend.loadedGraphs).not.to.haveMember(graphName)
        expect(backend.loadedGraphs.size).to.equal(0)
      })
    })
  })
})
