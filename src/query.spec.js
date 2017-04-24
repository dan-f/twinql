/* eslint-env mocha */
import nock from 'nock'

import query from './query'
import WebBackend from './backends/web-backend'

import aliceTtl from '../test/alice'
import bobTtl from '../test/bob'

describe('query', () => {
  describe('query', () => {
    const ALICE_ORIGIN = 'https://alice.com'
    const BOB_ORIGIN = 'https://alice.com'

    let backend

    beforeEach(() => {
      backend = new WebBackend()
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('allows parse errors to bubble up to the caller', () => {
      return expect(query(backend, 'foo bar'))
        .to.eventually.be.rejectedWith(/Expected a token/)
    })

    it('can run a query with an empty node specifier', () => {
      nock('https://alice.com/')
        .get('graph')
        .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

      const queryString = `
        https://alice.com/graph#alice {}
      `
      return expect(query(backend, queryString))
        .to.eventually.eql({
          '@id': 'https://alice.com/graph#alice'
        })
    })

    it('can run a query with a matching subject node specifier', () => {
      nock('https://alice.com/')
        .persist()
        .get('/graph')
        .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

      const queryString = `
        @prefix rdf http://www.w3.org/1999/02/22-rdf-syntax-ns#
        @prefix foaf http://xmlns.com/foaf/0.1/

        https://alice.com/graph#alice (
          rdf:type foaf:Person
          foaf:name "Alice"
        ) {}
      `
      return expect(query(backend, queryString))
        .to.eventually.eql({
          '@context': {
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            foaf: 'http://xmlns.com/foaf/0.1/'
          },
          '@id': 'https://alice.com/graph#alice'
        })
    })

    it('can run a query with a matching graph node specifier', () => {
      nock('https://alice.com/')
        .persist()
        .get('/graph')
        .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

      const queryString = `
        @prefix rdf http://www.w3.org/1999/02/22-rdf-syntax-ns#
        @prefix foaf http://xmlns.com/foaf/0.1/

        https://alice.com/graph => (
          rdf:type foaf:Person
          foaf:name "Alice"
        ) {}
      `
      return expect(query(backend, queryString))
        .to.eventually.eql({
          '@context': {
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            foaf: 'http://xmlns.com/foaf/0.1/'
          },
          '@id': 'https://alice.com/graph',
          '@graph': [
            { '@id': 'https://alice.com/graph#alice' }
          ]
        })
    })

    it('can traverse a single edge', () => {
      nock('https://alice.com/')
        .get('/graph')
        .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

      const queryString = `
        @prefix foaf http://xmlns.com/foaf/0.1/
        @prefix alice https://alice.com/graph#

        alice:alice {
          foaf:name
        }
      `
      return expect(query(backend, queryString))
        .to.eventually.eql({
          '@context': {
            alice: 'https://alice.com/graph#',
            foaf: 'http://xmlns.com/foaf/0.1/'
          },
          '@id': 'https://alice.com/graph#alice',
          'foaf:name': "Alice"
        })
    })

    it('can traverse a multi edge', () => {
      nock('https://alice.com/')
        .get('/graph')
        .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

      const queryString = `
        @prefix foaf http://xmlns.com/foaf/0.1/

        https://alice.com/graph#alice {
          [ foaf:knows ]
        }
      `
      return expect(query(backend, queryString))
        .to.eventually.eql({
          '@context': {
            foaf: 'http://xmlns.com/foaf/0.1/'
          },
          '@id': 'https://alice.com/graph#alice',
          'foaf:knows': [
            'https://bob.com/graph#bob',
            'https://alice.com/graph#spot'
          ]
        })
    })

    it('can run a subquery', () => {
      nock('https://alice.com/')
        .get('/graph')
        .reply(200, aliceTtl, { 'content-type': 'text/turtle' })
      nock('https://bob.com/')
        .get('/graph')
        .reply(200, bobTtl, { 'content-type': 'text/turtle' })

      const queryString = `
        @prefix foaf http://xmlns.com/foaf/0.1/

        https://alice.com/graph#alice {
          [ foaf:knows ] {
            foaf:name
          }
        }
      `
      return expect(query(backend, queryString))
        .to.eventually.eql({
          '@context': {
            foaf: 'http://xmlns.com/foaf/0.1/'
          },
          '@id': 'https://alice.com/graph#alice',
          'foaf:knows': [
            {
              '@id': 'https://bob.com/graph#bob',
              'foaf:name': 'Bob'
            },
            {
              '@id': 'https://alice.com/graph#spot',
              'foaf:name': 'Spot'
            }
          ]
        })
    })

    it('returns errors in the response body', () => {
      nock('https://alice.com/')
        .get('/graph')
        .reply(200, aliceTtl, { 'content-type': 'text/turtle' })
      nock('https://bob.com/')
        .get('/graph')
        .reply(404)

      const queryString = `
        @prefix foaf http://xmlns.com/foaf/0.1/

        https://alice.com/graph#alice {
          [ foaf:knows ] {
            foaf:name
          }
        }
      `
      return expect(query(backend, queryString))
        .to.eventually.eql({
          '@context': {
            foaf: 'http://xmlns.com/foaf/0.1/'
          },
          '@id': 'https://alice.com/graph#alice',
          'foaf:knows': [
            {
              '@id': 'https://bob.com/graph#bob',
              '@error': {
                'type': 'HttpError',
                'status': 404,
                'message': 'Not Found'
              }
            },
            {
              '@id': 'https://alice.com/graph#spot',
              'foaf:name': 'Spot'
            }
          ]
        })
    })

    it(`maps a single edge to null when it doesn't exist on its subject`, () => {
      nock('https://alice.com/')
        .get('/graph')
        .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

      const queryString = `
        @prefix foaf http://xmlns.com/foaf/0.1/

        https://alice.com/graph#alice {
          foaf:homepage
        }
      `
      return expect(query(backend, queryString))
        .to.eventually.eql({
          '@context': {
            foaf: 'http://xmlns.com/foaf/0.1/'
          },
          '@id': 'https://alice.com/graph#alice',
          'foaf:homepage': null
        })
    })

    it(`maps a multi edge to an empty array when it doesn't exist on its subject`, () => {
      nock('https://alice.com/')
        .get('/graph')
        .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

      const queryString = `
        @prefix foaf http://xmlns.com/foaf/0.1/

        https://alice.com/graph#alice {
          [ foaf:homepage ]
        }
      `
      return expect(query(backend, queryString))
        .to.eventually.eql({
          '@context': {
            foaf: 'http://xmlns.com/foaf/0.1/'
          },
          '@id': 'https://alice.com/graph#alice',
          'foaf:homepage': []
        })
    })

    it('formats datatypes in the response', () => {
      nock('https://alice.com/')
        .get('/graph')
        .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

      const queryString = `
        @prefix foaf http://xmlns.com/foaf/0.1/

        https://alice.com/graph#alice {
          foaf:age
        }
      `
      return expect(query(backend, queryString))
        .to.eventually.eql({
          '@context': {
            foaf: 'http://xmlns.com/foaf/0.1/'
          },
          '@id': 'https://alice.com/graph#alice',
          'foaf:age': {
            '@type': 'http://www.w3.org/2001/XMLSchema#integer',
            '@value': '24'
          }
        })
    })

    it('formats language in the response', () => {
      nock('https://alice.com/')
        .get('/graph')
        .reply(200, aliceTtl, { 'content-type': 'text/turtle' })

      const queryString = `
        @prefix foaf http://xmlns.com/foaf/0.1/

        https://alice.com/graph#alice {
          foaf:based_near
        }
      `
      return expect(query(backend, queryString))
        .to.eventually.eql({
          '@context': {
            foaf: 'http://xmlns.com/foaf/0.1/'
          },
          '@id': 'https://alice.com/graph#alice',
          'foaf:based_near': {
            '@language': 'es',
            '@type': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
            '@value': 'Estados Unidos'
          }
        })
    })
  })
})
