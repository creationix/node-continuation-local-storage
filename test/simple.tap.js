'use strict';

// stdlib
var tap = require('tap');
var test = tap.test;
var EventEmitter = require('events').EventEmitter;

// module under test
var context = require('../context');

// multiple contexts in use
var tracer = context.createNamespace('tracer');

function Trace(harvester) {
  this.harvester = harvester;
}

Trace.prototype.runHandler = function (callback) {
  var trace = tracer.createContext();

  trace.on('end', function () {
    var transaction = trace.get('transaction');
    this.harvester.emit('finished', transaction);
  }.bind(this));

  trace.run(callback);
};


test("simple tracer built on contexts", function (t) {
  t.plan(6);

  var harvester = new EventEmitter();
  var trace = new Trace(harvester);

  harvester.on('finished', function (transaction) {
    t.ok(transaction, "transaction should have been passed in");
    t.equal(transaction.status, 'ok', "transaction should have finished OK");
    t.equal(Object.keys(process.namespaces).length, 1, "Should only have one namespace.");
  });

  trace.runHandler(function inScope() {
    t.ok(tracer.active, "tracer should have an active context");
    tracer.set('transaction', {status : 'ok'});
    t.ok(tracer.get('transaction'), "can retrieve newly-set value");
    t.equal(tracer.get('transaction').status, 'ok', "value should be correct");
  });
});
