import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { AST } from '../src/lang/ast'
import { Node } from '../src/rdf/node'

global.expect = chai.expect

chai.use(chaiAsPromised)

// RDF helpers
chai.use((_chai, utils) => {
  const { Assertion } = _chai

  Assertion.addProperty('node', function () {
    const obj = this._obj
    this.assert(
      obj instanceof Node,
      'expected #{this} to be a Node',
      'expected #{this} not to be a Node'
    )
  })

  Assertion.addMethod('value', function (value) {
    const obj = this._obj
    this.assert(
      obj.value === value,
      'expected #{this} to have value #{exp}, but got #{act}',
      'expected #{this} not to have value #{exp}, but got #{act}',
      value,
      obj.value
    )
  })

  Assertion.addMethod('termType', function (termType) {
    const obj = this._obj
    this.assert(
      obj.termType === termType,
      'expected #{this} to have termType #{exp}, but got #{act}',
      'expected #{this} not to have termType #{exp}, but got #{act}',
      termType,
      obj.termType
    )
  })

  Assertion.addMethod('language', function (language) {
    const obj = this._obj
    this.assert(
      obj.language === language,
      'expected #{this} to have language #{exp}, but got #{act}',
      'expected #{this} not to have language #{exp}, but got #{act}',
      language,
      obj.language
    )
  })

  Assertion.addMethod('datatype', function (datatype) {
    const obj = this._obj
    this.assert(
      obj.datatype === datatype,
      'expected #{this} to have datatype #{exp}, but got #{act}',
      'expected #{this} not to have datatype #{exp}, but got #{act}',
      datatype,
      obj.datatype
    )
  })
})

// Parser helpers
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
