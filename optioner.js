/*
  MIT License,
  Copyright (c) 2016, Richard Rodger and other contributors.
*/

'use strict'

var Util = require('util')

var Joi = require('joi')
var Hoek = require('hoek')


module.exports = function (spec) {
  return make_optioner(spec)
}
module.exports.inject = inject
module.exports.arr2obj = arr2obj
module.exports.obj2arr = obj2arr


function make_optioner (spec) {
  var ctxt = {arrpaths: []}
  var joispec = prepare_spec(spec, ctxt)
  var schema = Joi.compile(joispec)

  return function optioner (input, done) {
    var work = Hoek.clone(input)
    work = arr2obj(work, ctxt)

    Joi.validate(work, schema, function (err, out) {
      done(err, obj2arr(out, ctxt))
    })
  }
}


function prepare_spec (spec, ctxt) {
  var joi = walk(
    Joi.object(),
    spec,
    '',
    ctxt,
    function (valspec) {
      if (valspec && valspec.isJoi) {
        return valspec
      }
      else {
        return Joi.default(valspec)
      }
    })

  return joi
}


function walk (joi, obj, path, ctxt, mod) {
  if (Util.isArray(obj)) {
    ctxt.arrpaths.push(path)
  }

  for (var p in obj) {
    var v = obj[p]
    var t = typeof v

    var kv = {}

    if (null != v && !v.isJoi && 'object' === t) {
      var np = '' === path ? p : path + '.' + p
      kv[p] = walk(Joi.object().default(), v, np, ctxt, mod)
    }
    else {
      kv[p] = mod(v)
    }

    joi = joi.keys(kv)
  }

  return joi
}


function inject (path, val, obj) {
  var root = obj

  if (null == obj) return obj

  var pp = ('string' === typeof path ? path : '').split('.')

  for (var i = 0; i < pp.length - 1; ++i) {
    var n = obj[pp[i]]
    if (null == n) {
      n = obj[pp[i]] = isNaN(parseInt(pp[i + 1], 10)) ? {} : []
    }
    obj = n
  }

  if ('' === pp[i]) {
    root = val
  }
  else {
    obj[pp[i]] = val
  }

  return root
}


function arr2obj (work, ctxt) {
  if (null == work) return work

  for (var apI = 0; apI < ctxt.arrpaths.length; ++apI) {
    var ap = ctxt.arrpaths[apI]
    var arr = '' === ap ? work : Hoek.reach(work, ap)

    if (Util.isArray(arr)) {
      var obj = {}

      for (var i = 0; i < arr.length; ++i) {
        obj[i] = arr[i]
      }

      work = inject(ap, obj, work)
    }
  }

  return work
}

function obj2arr (work, ctxt) {
  if (null == work) return work

  for (var apI = 0; apI < ctxt.arrpaths.length; ++apI) {
    var ap = ctxt.arrpaths[apI]
    var obj = '' === ap ? work : Hoek.reach(work, ap)

    if (!Util.isArray(obj)) {
      var arr = []

      for (var p in obj) {
        var i = parseInt(p, 10)
        if (!isNaN(i) && 0 <= i) {
          arr[i] = obj[p]
        }
      }

      work = inject(ap, arr, work)
    }
  }

  return work
}