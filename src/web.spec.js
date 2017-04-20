/* eslint-env mocha */
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import nock from 'nock'

import { HttpError } from './errors'
import { fetchGraph } from './web'
import Graph from './rdf/graph'

chai.use(chaiAsPromised)

describe('web', () => {
  describe('fetchGraph', () => {
    const DOMAIN = 'http://localhost:8000'

    afterEach(() => {
      nock.cleanAll()
    })

    it('rejects on non-2XX statuses', () => {
      nock(DOMAIN)
        .get('/graph')
        .reply(400)

      return expect(fetchGraph(`${DOMAIN}/graph`))
        .to.be.rejectedWith('Bad Request')
    })

    it('rejects on timeout', () => {
      nock(DOMAIN)
        .get('/graph')
        .reply((uri, requestBody, cb) => setTimeout(() => cb(
          null,
          [200, '', { 'Content-Type': 'text/turtle' }]
        ), 1))

      return expect(fetchGraph(`${DOMAIN}/graph`, { timeout: 0 }))
        .to.be.rejectedWith('Request timed out')
    })

    it('resolves to the indexed graph stored at the given URI', () => {
      nock(DOMAIN)
        .get('/graph')
        .reply(200, '', { 'Content-Type': 'text/turtle' })

      return expect(fetchGraph(`${DOMAIN}/graph`))
        .to.eventually.eql(new Graph())
    })
  })
})
