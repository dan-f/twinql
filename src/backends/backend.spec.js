/* eslint-env mocha */
import { spy } from 'sinon'

import Backend from './backend'

describe('backend', () => {
  describe('Backend', () => {
    it('has an abstract getObjects method', () => {
      return expect(new Backend().getObjects())
        .to.be.rejectedWith(/not implemented/)
    })

    it('has an abstract getSubjects method', () => {
      return expect(new Backend().getSubjects())
        .to.be.rejectedWith(/not implemented/)
    })

    describe('events', () => {
      it('can register and trigger event handlers', () => {
        const spy1 = spy()
        const spy2 = spy()
        const spy3 = spy()
        const backend = new Backend()
        backend.on('myEvent', spy1)
        backend.on('myEvent', spy2)
        backend.on('someOtherEvent', spy3)
        backend.trigger('myEvent')
        expect(spy1).to.have.been.calledOnce
        expect(spy2).to.have.been.calledOnce
        expect(spy3).not.to.have.been.called
      })
    })
  })
})
