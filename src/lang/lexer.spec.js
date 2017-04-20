/* eslint-env mocha */

import { expect } from 'chai'

import { IllegalCharacterError } from '../errors'
import lex from './lexer'

describe('lexer', () => {
  describe('lex', () => {
    const exhaust = str => {
      const items = []
      for (let item of lex(str)) {
        items.push(item)
      }
      return items
    }

    const eof = (line, column) => ({
      type: 'EOF',
      value: null,
      line,
      column
    })

    it('returns a generator', () => {
      expect(lex('')).to.be.a('generator')
    })

    it('throws an error if it sees an unallowed character', () => {
      expect(() => exhaust('~'))
        .to.throw(/Illegal character/)
    })

    it('throws an error if it reaches EOF without closing a keyword', () => {
      expect(() => exhaust('='))
        .to.throw(/Unterminated keyword/)
      expect(() => exhaust('@prefi'))
        .to.throw(/Unterminated keyword/)
    })

    it('throws an error if it reaches EOF without closing a literal', () => {
      expect(() => exhaust('"hello'))
        .to.throw(/Unterminated string literal/)
    })

    it(`throws an error if it doesn't recognize a token`, () => {
      expect(() => exhaust('a~sdf'))
        .to.throw(/Unrecognized token/)
    })

    it('just returns EOF for an empty query', () => {
      expect(exhaust(''))
        .to.eql([eof(1, 0)])
    })

    describe('recognizes a', () => {
      it('URI', () => {
        expect(exhaust('https://example.com/')).to.eql([
          {
            line: 1,
            column: 0,
            type: 'URI',
            value: 'https://example.com/'
          },
          eof(1, 20)
        ])
      })

      it('prefixed URI', () => {
        expect(exhaust('ex:something')).to.eql([
          {
            line: 1,
            column: 0,
            type: 'PREFIXED_URI',
            value: {
              prefix: 'ex',
              path: 'something'
            }
          },
          eof(1, 12)
        ])
      })

      it('name', () => {
        expect(exhaust('foo')).to.eql([
          {
            line: 1,
            column: 0,
            type: 'NAME',
            value: 'foo'
          },
          eof(1, 3)
        ])
      })

      it('string literal', () => {
        expect(exhaust('"foo"')).to.eql([
          {
            line: 1,
            column: 0,
            type: 'STRLIT',
            value: 'foo'
          },
          eof(1, 5)
        ])
      })

      it('EOF', () => {
        expect(exhaust('\n\n  ')).to.eql([
          eof(3, 2)
        ])
      })

      describe('symbols', () => {
        ;[
          ['parens', 'LPAREN', '(', 'RPAREN', ')'],
          ['braces', 'LBRACE', '{', 'RBRACE', '}'],
          ['square brackets', 'LSQUARE', '[', 'RSQUARE', ']'],
        ].map(([ symbolName, lSymbol, lValue, rSymbol, rValue ]) => {
          it(symbolName, () => {
            expect(exhaust(`${lValue}${rValue}`)).to.eql([
              {
                line: 1,
                column: 0,
                type: lSymbol,
                value: lValue
              },
              {
                line: 1,
                column: 1,
                type: rSymbol,
                value: rValue
              },
              eof(1, 2)
            ])
          })
        })
      })

      describe('keywords', () => {
        it('arrow', () => {
          expect(exhaust('=>')).to.eql([
            {
              line: 1,
              column: 0,
              type: 'ARROW',
              value: '=>'
            },
            eof(1, 2)
          ])
        })

        it('prefix', () => {
          expect(exhaust('@prefix')).to.eql([
            {
              line: 1,
              column: 0,
              type: 'PREFIX',
              value: '@prefix'
            },
            eof(1, 7)
          ])
        })
      })
    })

    describe('token breaks', () => {
      it('are signified by whitespace', () => {
        expect(exhaust('foo bar =>\n(')).to.eql([
          {
            line: 1,
            column: 0,
            type: 'NAME',
            value: 'foo'
          },
          {
            line: 1,
            column: 4,
            type: 'NAME',
            value: 'bar'
          },
          {
            line: 1,
            column: 8,
            type: 'ARROW',
            value: '=>'
          },
          {
            line: 2,
            column: 0,
            type: 'LPAREN',
            value: '('
          },
          eof(2, 1)
        ])
      })
    })
  })
})
