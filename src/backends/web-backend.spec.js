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
        expect(backend.loadingGraphs).not.to.have.property(graphName)
        const concurrentLoadGraphs = Promise.all([
          backend.ensureGraphLoaded(graphName),
          backend.ensureGraphLoaded(graphName)
        ])
        return expect(concurrentLoadGraphs).to.be.fulfilled
          .then(() => {
            expect(backend.loadingGraphs).to.have.property(graphName)
            const alice = Node({ termType: 'NamedNode', value: `${graphName}#alice` })
            const knows = Node({ termType: 'NamedNode', value: 'http://xmlns.com/foaf/0.1/knows' })
            const bob = Node({ termType: 'NamedNode', value: 'https://bob.com/graph#bob' })
            const spot = Node({ termType: 'NamedNode', value: 'https://alice.com/graph#spot' })
            expect(backend.graph.match({ subject: alice, predicate: knows}))
              .to.equal(nodeSet([bob, spot]))
            // Even though we asked for the graph to be loaded concurrently,
            // `fetchGraph` should only be called once, since the request were
            // for the same resource.
            expect(fetchGraphSpy).to.have.been.calledOnce
          })
      })

      it('resets the list of loaded graphs at the end of a query', () => {
        const backend = new WebBackend()
        const graphName = 'https://example.com/graph'
        backend.loadingGraphs[graphName] = Promise.resolve(true)
        backend.trigger('queryDone')
        expect(backend.loadingGraphs).not.to.have.property(graphName)
        expect(Object.keys(backend.loadingGraphs).length).to.equal(0)
      })
    })
  })
})
