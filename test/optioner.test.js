'use strict'

var Optioner = require('..')
var Joi = require('joi')

var Code = require('code')
var Lab = require('lab')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var expect = Code.expect


describe('optioner', function () {
  it('happy', function (done) {
    var opter = Optioner({
      a: 1,
      b: {c: 2},
      d: {e: {f: 3}},
      g: null,
      h: Joi.number().integer().default(4),
      i: [Joi.number().integer().default(5), 6],
      j: [{k: 7}]
    })

    opter({}, function (err, out) {
      if (err) return done(err)
      // console.log('OUT', out)
      expect(out).to.deep.equal({
        a: 1,
        b: { c: 2 },
        d: { e: { f: 3 } },
        g: null,
        h: 4,
        i: [ 5, 6 ],
        j: [ { k: 7 } ] })
      done()
    })
  })


  it('array', function (done) {
    var opter = Optioner([
      1, Joi.string().default('a')
    ])

    opter({}, function (err, out) {
      if (err) return done(err)
      expect(out).to.deep.equal([1, 'a'])

      opter([], function (err, out) {
        if (err) return done(err)
        expect(out).to.deep.equal([1, 'a'])

        opter([1], function (err, out) {
          if (err) return done(err)
          expect(out).to.deep.equal([1, 'a'])

          done()
        })
      })
    })
  })


  it('inject', function (done) {
    expect(Optioner.inject(null, {x: 1}, {y: 1})).to.deep.equal({x: 1})
    expect(Optioner.inject('', {x: 1}, {y: 1})).to.deep.equal({x: 1})
    expect(Optioner.inject('', {'0': 1}, [1])).to.deep.equal({'0': 1})
    expect(Optioner.inject('a', 1, null)).to.equal(null)

    expect(Optioner.inject('a', 1, {})).to.deep.equal({a: 1})
    expect(Optioner.inject('a.b', 2, {a: {}})).to.deep.equal({a: {b: 2}})
    expect(Optioner.inject('a.b', 2, {})).to.deep.equal({a: {b: 2}})

    expect(Optioner.inject('0', 1, [])).to.deep.equal([1])
    expect(Optioner.inject('a.0', 1, {a: [2, 2]})).to.deep.equal({a: [1, 2]})
    expect(Optioner.inject('a.0', 1, {})).to.deep.equal({a: [1]})
    expect(Optioner.inject('a.0.b', 1, {a: [{c: 2}]}))
      .to.deep.equal({a: [{c: 2, b: 1}]})
    done()
  })


  it('arr2obj', function (done) {
    expect(Optioner.arr2obj({a: [1]}, {arrpaths: ['a']}))
      .to.deep.equal({a: {'0': 1}})
    expect(Optioner.arr2obj({a: [1]}, {arrpaths: []}))
      .to.deep.equal({a: [1]})

    expect(Optioner.arr2obj([1], {arrpaths: ['']}))
      .to.deep.equal({'0': 1})
    expect(Optioner.arr2obj(null, {arrpaths: ['a']}))
      .to.equal(null)

    expect(Optioner.arr2obj({a: [1], b: {c: [2]}}, {arrpaths: ['a', 'b.c']}))
      .to.deep.equal({a: {'0': 1}, b: {c: {'0': 2}}})

    done()
  })


  it('obj2arr', function (done) {
    expect(Optioner.obj2arr({a: {'0': 1}}, {arrpaths: ['a']}))
      .to.deep.equal({a: [1]})
    expect(Optioner.obj2arr({a: {'0': 1}}, {arrpaths: []}))
      .to.deep.equal({a: {'0': 1}})
    expect(Optioner.obj2arr({a: [1]}, {arrpaths: ['a']}))
      .to.deep.equal({a: [1]})
    expect(Optioner.obj2arr({a: {'0': 1, '-1': 2, 'x': 3}}, {arrpaths: ['a']}))
      .to.deep.equal({a: [1]})

    expect(Optioner.obj2arr({'0': 1}, {arrpaths: ['']}))
      .to.deep.equal([1])

    expect(Optioner.obj2arr(null, {arrpaths: ['']}))
      .to.equal(null)

    expect(Optioner.obj2arr({a: {'0': 1}, b: {c: {'0': 2}}},
                            {arrpaths: ['a', 'b.c']}))
      .to.deep.equal({a: [1], b: {c: [2]}})

    done()
  })


  it('readme', function (done) {
    var optioner = Optioner({
      color: 'red',
      size: Joi.number().integer().max(5).min(1).default(3),
      range: [100, 200]
    })

    optioner({}, function (err, out) {
      if (err) return done(err)
      // prints: { color: 'red', size: 3, range: [ 100, 200 ] }
      // console.log(out)
    })

    optioner({range: [50]}, function (err, out) {
      if (err) return done(err)
      // prints: { range: [ 50, 200 ], color: 'red', size: 3 }
      // console.log(out)
    })

    optioner({size: 6}, function (err, out) {
      if (err) return
      // prints: child "size" fails because ["size" must be less than or equal to 5
      // console.log(err)
    })

    done()
  })
})

