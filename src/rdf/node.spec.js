/* eslint-env mocha */
import Immutable from 'immutable'

import { Node, nodeSet } from './node'

describe('node', () => {
  describe('Node', () => {
    it('constructs an immutable record', () => {
      expect(Node()).to.be.an.instanceof(Immutable.Record)
    })

    it('creates default fields for `termType`, `value`, `language`, and `datatype`', () => {
      const node = Node()
      expect(node.termType).to.be.null
      expect(node.value).to.be.null
      expect(node.language).to.be.null
      expect(node.datatype).to.be.null
      expect(node.notRealField).to.be.undefined
    })
  })

  describe('nodeSet', () => {
    it('creates an immutable set', () => {
      expect(nodeSet()).to.be.an.instanceof(Immutable.Set)
    })

    it('converts its iterable argument to Nodes', () => {
      const ns = nodeSet([
        { termType: 'NamedNode', value: 'https://example.com/' }
      ])
      const first = ns.first()
      expect(first).to.be.an.instanceof(Immutable.Record)
      expect(first.termType).to.equal('NamedNode')
      expect(first.value).to.equal('https://example.com/')
    })
  })
})
