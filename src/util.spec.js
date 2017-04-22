/* eslint-env mocha */
import { iterObj } from './util'

describe('util', () => {
  describe('iterObj', () => {
    it('iterates over the key/value pairs in plain objects', () => {
      const obj = {
        one: 'ONE',
        two: 2,
        three: x => x * 2
      }
      const foundKeyValPairs = []
      for (let kvp of iterObj(obj)) {
        foundKeyValPairs.push(kvp)
      }
      expect(Object.keys(obj)).to.eql(foundKeyValPairs.map(([k, v]) => k))
      expect(Object.values(obj)).to.eql(foundKeyValPairs.map(([k, v]) => v))
    })
  })
})
