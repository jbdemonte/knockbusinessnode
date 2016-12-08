var unix = require('unix-dgram');
var microtime = require('microtime');
var fs = require('fs');
var expect = require('chai').expect;
var Knock = require('../index');

var socketFile = __dirname + '/unit.tests.knockprobe';

describe('knockprobe', function () {
  var server, received = [], chunks = [];

  before(function () {
    server = unix.createSocket('unix_dgram', function (buf) {
      received = received.concat(JSON.parse(buf));
      chunks.push(JSON.parse(buf));
    });
    server.bind(socketFile);
  });

  beforeEach(function () {
    received = [];
    chunks = [];
  });

  after(function () {
    server.close();
    fs.unlink(socketFile);
  });

  function wait(fn, delay) {
    setTimeout(fn, delay || 25);
  }

  it('should not autocommit a gauge', function (done) {
    var k = new Knock(socketFile);
    expect(k.gauge('apple', 2)).to.eql(true);
    wait(function () {
      expect(received).to.eql([]);
      done();
    });
  });

  [true, false, null, undefined, {}, [], '', (new Array(100)).join('A')].forEach(function (name) {
    it('should reject a bad name in a gauge: ' + JSON.stringify(name), function (done) {
      var k = new Knock(socketFile);
      expect(k.gauge(name, 2)).to.eql(false);
      expect(k.commit()).to.eql(0);
      wait(function () {
        expect(received).to.eql([]);
        done();
      });
    });
  });

  [true, false, null, undefined, {}, []].forEach(function (value) {
    it('should reject a bad value in a gauge: ' + JSON.stringify(value), function (done) {
      var k = new Knock(socketFile);
      expect(k.gauge('apple', value)).to.eql(false);
      expect(k.commit()).to.eql(0);
      wait(function () {
        expect(received).to.eql([]);
        done();
      });
    });
  });

  it('should send a simple gauge', function (done) {
    var k = new Knock(socketFile);
    expect(k.gauge('apple', 2)).to.eql(true);
    expect(k.commit()).to.eql(1);
    wait(function () {
      expect(received).to.eql([[ 'apple', 'G', 2 ]]);
      done();
    });
  });

  it('should send multiple gauges', function (done) {
    var k = new Knock(socketFile);
    expect(k.gauge('apple', 2)).to.eql(true);
    expect(k.gauge('orange', 3)).to.eql(true);
    expect(k.gauge('apple', 4)).to.eql(true);   // should overwrite previous "apple"

    expect(k.commit()).to.eql(2);

    wait(function () {
      expect(received).to.eql([[ 'apple', 'G', 4 ], [ 'orange', 'G', 3 ]]);
      done();
    });
  });

  it('should not autocommit an increment', function (done) {
    var k = new Knock(socketFile);
    expect(k.increment('action', 2)).to.eql(true);
    wait(function () {
      expect(received).to.eql([]);
      done();
    });
  });

  [true, false, null, undefined, {}, [], '', (new Array(100)).join('A')].forEach(function (name) {
    it('should reject a bad name in a increment: ' + JSON.stringify(name), function (done) {
      var k = new Knock(socketFile);
      expect(k.increment(name, 2)).to.eql(false);
      expect(k.commit()).to.eql(0);
      wait(function () {
        expect(received).to.eql([]);
        done();
      });
    });
  });

  [true, false, null, undefined, {}, []].forEach(function (value) {
    it('should reject a bad value in a increment: ' + JSON.stringify(value), function (done) {
      var k = new Knock(socketFile);
      expect(k.increment('action', value)).to.eql(false);
      expect(k.commit()).to.eql(0);
      wait(function () {
        expect(received).to.eql([]);
        done();
      });
    });
  });

  it('should send a an increment', function (done) {
    var k = new Knock(socketFile);
    expect(k.increment('action', 2)).to.eql(true);
    expect(k.commit()).to.eql(1);
    wait(function () {
      expect(received).to.eql([[ 'action', 'C', 2 ]]);
      done();
    });
  });

  it('should send multiple increments', function (done) {
    var k = new Knock(socketFile);

    expect(k.increment('action1', 12)).to.eql(true);
    expect(k.increment('action2', 1)).to.eql(true);
    expect(k.increment('action1', -3)).to.eql(true); // should be merge with previous action 1

    expect(k.commit()).to.eql(2);

    wait(function () {
      expect(received).to.eql([[ 'action1', 'C', 9 ], [ 'action2', 'C', 1 ]]);
      done();
    });
  });

  [true, false, null, undefined, {}, [], '', (new Array(100)).join('A')].forEach(function (name) {
    it('should reject a bad name in a start_delay: ' + JSON.stringify(name), function (done) {
      var k = new Knock(socketFile);
      expect(k.start_delay(name)).to.eql(false);
      expect(k.commit()).to.eql(0);
      wait(function () {
        expect(received).to.eql([]);
        done();
      });
    });
  });

  it('should should not send anything on start_delay', function (done) {
    var k = new Knock(socketFile);
    var timecode = k.start_delay('api_facebook_request');

    expect(timecode).to.be.an('array');
    expect(timecode.length).to.eql(2);
    expect(timecode[0]).to.eql('api_facebook_request');
    expect(timecode[1]).to.be.a('number');

    wait(function () {
      expect(received).to.eql([]);
      done();
    });
  });

  it('should not send anything on start_delay', function (done) {
    var k = new Knock(socketFile);
    var timecode = k.start_delay('api_facebook_request');

    expect(timecode).to.be.an('array');
    expect(timecode.length).to.eql(2);
    expect(timecode[0]).to.eql('api_facebook_request');
    expect(timecode[1]).to.be.a('number');

    wait(function () {
      expect(received).to.eql([]);
      done();
    });
  });

  it('should not autocommit a stop_delay', function (done) {
    var k = new Knock(socketFile);
    var timecode = k.start_delay('api_facebook_request');
    expect(k.stop_delay(timecode)).to.eql(true);

    wait(function () {
      expect(received).to.eql([]);
      done();
    });
  });

  it('should reject a missing timecode in a stop_delay', function (done) {
    var k = new Knock(socketFile);
    expect(k.stop_delay()).to.eql(false);
    expect(k.commit()).to.eql(0);
    wait(function () {
      expect(received).to.eql([]);
      done();
    });
  });

  [
    true, false, null, undefined, 0, 1, {}, [],
    ['api_facebook_request'],
    ['api_facebook_request', microtime.now(), 'something else'],
    ['', microtime.now()],
    [(new Array(100)).join('A'), microtime.now()]
  ].forEach(function (timecode) {

    it('should reject an invalid timecode in a stop_delay: ' + JSON.stringify(timecode), function (done) {
      var k = new Knock(socketFile);
      expect(k.stop_delay()).to.eql(false);
      expect(k.commit()).to.eql(0);
      wait(function () {
        expect(received).to.eql([]);
        done();
      });
    });

  });

  it('should send a delay', function (done) {
    var k = new Knock(socketFile);
    var timecode = k.start_delay('api_facebook_request');

    setTimeout(function () {
      expect(k.stop_delay(timecode)).to.eql(true);
      expect(k.commit()).to.eql(1);

      wait(function () {
        expect(received.length).to.eql(1);
        received = received.shift();
        expect(received[0]).to.eql('api_facebook_request');
        expect(received[1]).to.eql('DTC');
        expect(received[2]).to.within(1150, 1250);
        done();
      });

    }, 1200);
  });

  it('should handle pagination when sending tons of events', function (done) {
    var k = new Knock(socketFile);
    var len = 30000;
    var BUFFER_LEN = 704; // voluntary set here, instead of getting it from Knock.BUFFER_LEN for example

    for (var i=0; i < len; i++) {
      expect(k.gauge('gauge' + i, i)).to.eql(true);
    }

    expect(k.commit()).to.eql(len);

    wait(function () {
      expect(received.length).to.eql(len);
      for (var i=0; i < len; i++) {
        expect(received[i]).to.eql([ 'gauge' + i, 'G', i]);
      }
      expect(chunks.length).to.eql(Math.ceil(len / BUFFER_LEN));
      chunks.forEach(function (chunk, index) {
        expect(chunk.length).to.eql(index < chunks.length - 1 ? BUFFER_LEN : len % BUFFER_LEN);
      });
      done();
    }, 300);
  });

});