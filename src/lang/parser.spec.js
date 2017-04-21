/* eslint-env mocha */

import chai, { expect } from 'chai'

import { AST } from './ast'
import parse, * as P from './parser'

chai.use((_chai, utils) => {
  const { Assertion } = _chai

  Assertion.addMethod('ast', function (type) {
    const obj = this._obj
    new Assertion(obj).to.be.instanceof(AST)
    new Assertion(obj.type).to.equal(type)
  })

  Assertion.addMethod('withValue', function (value) {
    const obj = this._obj
    new Assertion(obj.value).to.equal(value)
  })

  Assertion.addMethod('listOf', function (type) {
    const obj = this._obj
    new Assertion(obj).to.be.instanceof(Array)
    obj.map(child => new Assertion(child).to.be.ast(type))
  })
})

describe('parser', () => {
  const errorRegexp = (expected, actualValue, actualType) => {
    return new RegExp(
      `Expected a token of type\\(s\\) \\[${expected.join(', ')}\\], but got token '${actualValue}' of type ${actualType}`
    )
  }

  describe('query', () => {
    it('rejects an empty query', () => {
      expect(() => parse('')).to.throw(
        errorRegexp(['PREFIX', 'URI', 'PREFIXED_URI'], null, 'EOF')
      )
    })

    it('rejects a query with no context', () => {
      expect(() => parse(`
        @prefix foo https://example.com/foo
      `)).to.throw(
        errorRegexp(['URI', 'PREFIXED_URI'], null, 'EOF')
      )
      expect(() => parse(`
        @prefix foo https://example.com/foo {}
      `)).to.throw(
        errorRegexp(['URI', 'PREFIXED_URI'], '{', 'LBRACE')
      )
    })

    it('expects EOF after the query', () => {
      expect(() => parse(`
        https://example.com/ {}
        blah
      `)).to.throw(
        errorRegexp(['EOF'], 'blah', 'NAME')
      )
    })

    it('parses context and context sensitive query', () => {
      const query = parse(`
        https://example.com/graph#thing {}
      `)
      expect(query).to.be.an.ast('query')
      expect(query.prefixList).to.be.a.listOf('prefix').with.lengthOf(0)
      expect(query.context).to.be.an.ast('uri')
      expect(query.contextSensitiveQuery).to.be.an.ast('contextSensitiveQuery')
    })

    it('parses a prefix list, context, and context sensitive query', () => {
      const query = parse(`
        @prefix ex https://example.com/terms#

        https://example.com/graph#thing {}
      `)
      expect(query).to.be.an.ast('query')
      expect(query.prefixList).to.be.a.listOf('prefix').with.lengthOf(1)
      expect(query.context).to.be.an.ast('uri')
      expect(query.contextSensitiveQuery).to.be.an.ast('contextSensitiveQuery')
    })
  })

  describe('prefixList', () => {
    it('expects at least one prefix', () => {
      expect(() => parse('', P.prefix)).to.throw(
        errorRegexp(['PREFIX'], null, 'EOF')
      )
    })

    it('can parse a list of prefixes', () => {
      const prefixList = parse(`
        @prefix foo https://foo.com/
        @prefix bar https://bar.com/
      `, P.prefixList)
      expect(prefixList).to.be.a.listOf('prefix').with.lengthOf(2)
      expect(prefixList[0].name).to.be.an.ast('name').withValue('foo')
      expect(prefixList[0].uri).to.be.an.ast('uri').withValue('https://foo.com/')
      expect(prefixList[1].name).to.be.an.ast('name').withValue('bar')
      expect(prefixList[1].uri).to.be.an.ast('uri').withValue('https://bar.com/')
    })
  })

  describe('contextSensitiveQuery', () => {
    it('rejects an empty string', () => {
      expect(() => parse('', P.contextSensitiveQuery)).to.throw(
        errorRegexp(['LBRACE'], null, 'EOF')
      )
    })

    it('rejects a missing traversal', () => {
      expect(() => parse('()', P.contextSensitiveQuery)).to.throw(
        errorRegexp(['LBRACE'], null, 'EOF')
      )
    })

    it('parses a node specifier and a traversal', () => {
      const csq = parse('{}', P.contextSensitiveQuery)
      expect(csq).to.be.an.ast('contextSensitiveQuery')
      expect(csq.nodeSpecifier).to.be.an.ast('emptyNodeSpecifier')
      expect(csq.traversal).to.be.an.ast('traversal')
    })
  })

  describe('nodeSpecifier', () => {
    it('parses an empty node specifier', () => {
      const nodeSpecifier = parse('', P.nodeSpecifier)
      expect(nodeSpecifier).to.be.an.ast('emptyNodeSpecifier')
    })

    it('parses a matching node specifier (with implicit subject)', () => {
      const nodeSpecifier = parse('()', P.nodeSpecifier)
      expect(nodeSpecifier).to.be.an.ast('matchingNodeSpecifier')
      expect(nodeSpecifier.contextType).to.equal('subject')
      expect(nodeSpecifier.matchList).to.be.an('array')
    })

    it('parses a matching node specifier (with implicit graph)', () => {
      const nodeSpecifier = parse('=> ()', P.nodeSpecifier)
      expect(nodeSpecifier).to.be.an.ast('matchingNodeSpecifier')
      expect(nodeSpecifier.contextType).to.equal('graph')
      expect(nodeSpecifier.matchList).to.be.an('array')
    })
  })

  describe('matchList', () => {
    it('can parse an empty match list', () => {
      expect(parse('', P.matchList)).to.be.an('array').and.to.be.empty
    })

    it('can parse a number of matches', () => {
      const matchList = parse('ex:prop1 "foo" ex:prop2 "bar"', P.matchList)
      expect(matchList).to.be.an('array').with.lengthOf(2)
    })
  })

  describe('match', () => {
    it('rejects an empty string', () => {
      expect(() => parse('', P.match)).to.throw(
        errorRegexp(['URI', 'PREFIXED_URI'], null, 'EOF')
      )
    })

    it('parses a leaf match node where the value is a named node', () => {
      let match = parse('foaf:knows https://dan-f.databox.me/profile#me', P.match)
      expect(match).to.be.an.ast('leafMatch')
      expect(match.predicate).to.be.an.ast('prefixedUri')
      expect(match.value).to.be.an.ast('uri')
      match = parse('foaf:knows dan:me', P.match)
      expect(match).to.be.an.ast('leafMatch')
      expect(match.predicate).to.be.an.ast('prefixedUri')
      expect(match.value).to.be.an.ast('prefixedUri')
    })

    it('parses a leaf match node where the value is a string literal', () => {
      const match = parse('foaf:name "Daniel"', P.match)
      expect(match).to.be.an.ast('leafMatch')
      expect(match.predicate).to.be.an.ast('prefixedUri')
      expect(match.value).to.be.an.ast('stringLiteral')
    })

    it('parses a leaf match node where the value is a node specifier', () => {
      const match = parse('foaf:knows ( rdf:type foaf:person )', P.match)
      expect(match).to.be.an.ast('intermediateMatch')
      expect(match.predicate).to.be.an.ast('prefixedUri')
      expect(match.nodeSpecifier).to.be.an.ast('matchingNodeSpecifier')
    })
  })

  describe('id', () => {
    it('rejects on no URI', () => {
      expect(() => parse('', P.id)).to.throw(
        errorRegexp(['URI', 'PREFIXED_URI'], null, 'EOF')
      )
    })

    it('expects a URI', () => {
      const id = parse('https://example.com/', P.id)
      expect(id).to.be.an.ast('uri').withValue('https://example.com/')
    })

    it('expects a prefixed URI', () => {
      const id = parse('foo:bar', P.id)
      expect(id).to.be.an.ast('prefixedUri')
        .and.to.include({ prefix: 'foo', path: 'bar' })
    })
  })

  describe('traversal', () => {
    it('rejects on an empty string', () => {
      expect(() => parse('', P.traversal)).to.throw(
        errorRegexp(['LBRACE'], null, 'EOF')
      )
    })

    it('parses a selector list', () => {
      const traversal = parse('{}', P.traversal)
      expect(traversal).to.be.an.ast('traversal')
      expect(traversal.selectorList).to.be.an('array').with.lengthOf(0)
    })
  })

  describe('selectorList', () => {
    it('can parse an empty list of selectors', () => {
      const selectorList = parse('', P.selectorList)
      expect(selectorList).to.be.an('array').with.lengthOf(0)
    })

    it('can parse a list of some numer of selectors', () => {
      const selectorList = parse('foaf:name', P.selectorList)
      expect(selectorList).to.be.an('array').with.lengthOf(1)
    })
  })

  describe('selector', () => {
    it('rejects on the empty string', () => {
      expect(() => parse('', P.selector)).to.throw(
        errorRegexp(['LSQUARE', 'URI', 'PREFIXED_URI'], null, 'EOF')
      )
    })

    it('can parse a leaf selector', () => {
      const selector = parse('https://example.com/', P.selector)
      expect(selector).to.be.an.ast('leafSelector')
      expect(selector.edge).to.be.an.ast('singleEdge')
    })

    it('can parse a intermediate selector node', () => {
      let selector = parse('https://example.com/ {}', P.selector)
      expect(selector).to.be.an.ast('intermediateSelector')
      expect(selector.edge).to.be.an.ast('singleEdge')
      expect(selector.contextSensitiveQuery).to.be.an.ast('contextSensitiveQuery')
      selector = parse('https://example.com/ () {}', P.selector)
      expect(selector).to.be.an.ast('intermediateSelector')
      expect(selector.edge).to.be.an.ast('singleEdge')
      expect(selector.contextSensitiveQuery).to.be.an.ast('contextSensitiveQuery')
      selector = parse('https://example.com/ => () {}', P.selector)
      expect(selector).to.be.an.ast('intermediateSelector')
      expect(selector.edge).to.be.an.ast('singleEdge')
      expect(selector.contextSensitiveQuery).to.be.an.ast('contextSensitiveQuery')
    })
  })

  describe('edge', () => {
    it('rejects on the empty string', () => {
      expect(() => parse('', P.edge)).to.throw(
        errorRegexp(['LSQUARE', 'URI', 'PREFIXED_URI'], null, 'EOF')
      )
    })

    it('parses a single edge node', () => {
      let edge = parse('https://example.com/terms#foo', P.edge)
      expect(edge).to.be.an.ast('singleEdge')
      expect(edge.predicate).to.be.an.ast('uri')
      edge = parse('foo:bar', P.edge)
      expect(edge).to.be.an.ast('singleEdge')
      expect(edge.predicate).to.be.an.ast('prefixedUri')
    })

    it('parses a multi edge node', () => {
      const edge = parse('[ foo:bar ]', P.edge)
      expect(edge).to.be.an.ast('multiEdge')
      expect(edge.predicate).to.be.an.ast('prefixedUri')
    })
  })
})
