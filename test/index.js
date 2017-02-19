var unix = require('unix-dgram');
var fs = require('fs');
var expect = require('chai').expect;
var Knock = require('../index');
var Timecode = require('../lib/Timecode');

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
    Knock.reset();
  });

  after(function () {
    server.close();
    fs.unlink(socketFile);
  });

  function wait(fn, delay) {
    setTimeout(fn, delay || 50);
  }

  describe('commit', function () {
    before(function () {
      expect(Knock.connect(socketFile)).to.eql(true);
    });

    after(function () {
      Knock.disconnect();
    });

    it('should not autocommit a gauge', function (done) {
      this.timeout(15000);
      expect(Knock.gauge('apple', 2)).to.eql(true);
      wait(function () {
        expect(received).to.eql([]);
        done();
      }, 10000);
    });

    [true, false, null, undefined, {}, [], '', (new Array(100)).join('A')].forEach(function (name) {
      it('should reject a bad name in a gauge: ' + JSON.stringify(name), function (done) {
        expect(Knock.gauge(name, 2)).to.eql(false);
        expect(Knock.commit()).to.eql(0);
        wait(function () {
          expect(received).to.eql([]);
          done();
        });
      });
    });

    [true, false, null, undefined, {}, []].forEach(function (value) {
      it('should reject a bad value in a gauge: ' + JSON.stringify(value), function (done) {
        expect(Knock.gauge('apple', value)).to.eql(false);
        expect(Knock.commit()).to.eql(0);
        wait(function () {
          expect(received).to.eql([]);
          done();
        });
      });
    });

    it('should reset data', function (done) {
      var timecode = Knock.start_delay('api_facebook_request');
      expect(Knock.stop_delay(timecode)).to.eql(true);
      expect(Knock.gauge('apple', 2)).to.eql(true);
      expect(Knock.increment('action', 2)).to.eql(true);
      Knock.reset();
      expect(Knock.commit()).to.eql(0);
      wait(function () {
        expect(received).to.eql([]);
        done();
      });
    });

    it('should send a simple gauge', function (done) {
      expect(Knock.gauge('apple', 2)).to.eql(true);
      expect(Knock.commit()).to.eql(1);
      wait(function () {
        expect(received).to.eql([[ 'apple', 'G', 2 ]]);
        done();
      });
    });

    it('should send multiple gauges', function (done) {
      expect(Knock.gauge('apple', 2)).to.eql(true);
      expect(Knock.gauge('orange', 3)).to.eql(true);
      expect(Knock.gauge('apple', 4)).to.eql(true);   // should overwrite previous "apple"

      expect(Knock.commit()).to.eql(2);

      wait(function () {
        expect(received).to.eql([[ 'apple', 'G', 4 ], [ 'orange', 'G', 3 ]]);
        done();
      });
    });

    it('should not autocommit an increment', function (done) {
      expect(Knock.increment('action', 2)).to.eql(true);
      wait(function () {
        expect(received).to.eql([]);
        done();
      });
    });

    [true, false, null, undefined, {}, [], '', (new Array(100)).join('A')].forEach(function (name) {
      it('should reject a bad name in a increment: ' + JSON.stringify(name), function (done) {
        expect(Knock.increment(name, 2)).to.eql(false);
        expect(Knock.commit()).to.eql(0);
        wait(function () {
          expect(received).to.eql([]);
          done();
        });
      });
    });

    [true, false, null, undefined, {}, []].forEach(function (value) {
      it('should reject a bad value in a increment: ' + JSON.stringify(value), function (done) {
        expect(Knock.increment('action', value)).to.eql(false);
        expect(Knock.commit()).to.eql(0);
        wait(function () {
          expect(received).to.eql([]);
          done();
        });
      });
    });

    it('should send a an increment', function (done) {
      expect(Knock.increment('action', 2)).to.eql(true);
      expect(Knock.commit()).to.eql(1);
      wait(function () {
        expect(received).to.eql([[ 'action', 'C', 2 ]]);
        done();
      });
    });

    it('should send multiple increments', function (done) {
      expect(Knock.increment('action1', 12)).to.eql(true);
      expect(Knock.increment('action2', 1)).to.eql(true);
      expect(Knock.increment('action1', -3)).to.eql(true); // should be merge with previous action 1

      expect(Knock.commit()).to.eql(2);

      wait(function () {
        expect(received).to.eql([[ 'action1', 'C', 9 ], [ 'action2', 'C', 1 ]]);
        done();
      });
    });

    [true, false, null, undefined, {}, [], '', (new Array(100)).join('A')].forEach(function (name) {
      it('should reject a bad name in a start_delay: ' + JSON.stringify(name), function (done) {
        expect(Knock.start_delay(name)).to.eql(false);
        expect(Knock.commit()).to.eql(0);
        wait(function () {
          expect(received).to.eql([]);
          done();
        });
      });
    });

    it('should should not send anything on start_delay', function (done) {
      var timecode = Knock.start_delay('api_facebook_request');

      expect(timecode).to.be.an.instanceOf(Timecode);
      expect(timecode.item()).to.eql('api_facebook_request');
      expect(timecode.time()).to.be.a('number');

      wait(function () {
        expect(received).to.eql([]);
        done();
      });
    });

    it('should not autocommit a stop_delay', function (done) {
      var timecode = Knock.start_delay('api_facebook_request');
      expect(Knock.stop_delay(timecode)).to.eql(true);

      wait(function () {
        expect(received).to.eql([]);
        done();
      });
    });

    it('should reject a missing timecode in a stop_delay', function (done) {
      expect(Knock.stop_delay()).to.eql(false);
      expect(Knock.commit()).to.eql(0);
      wait(function () {
        expect(received).to.eql([]);
        done();
      });
    });

    it('should send a delay', function (done) {
      var timecode = Knock.start_delay('api_facebook_request');

      setTimeout(function () {
        expect(Knock.stop_delay(timecode)).to.eql(true);
        expect(Knock.commit()).to.eql(1);

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
      var len = 2025;
      var BUFFER_LEN = 50; // voluntary set here, instead of getting it from Knock.BUFFER_LEN for example

      for (var i=0; i < len; i++) {
        expect(Knock.gauge('gauge' + i, i)).to.eql(true);
      }

      expect(Knock.commit()).to.eql(len);

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
      }, 1000);
    });
  });

  describe('autocommit', function () {
    before(function () {
      expect(Knock.connect(socketFile)).to.eql(true);
      Knock.autocommit(200);
    });

    after(function () {
      Knock.disconnect();
    });

    it('should autocommit data', function (done) {
      var timecode = Knock.start_delay('api_facebook_request');
      expect(Knock.stop_delay(timecode)).to.eql(true);
      expect(Knock.gauge('apple', 2)).to.eql(true);
      expect(Knock.increment('action', 2)).to.eql(true);

      wait(function () {
        expect(received.length).to.eql(3);
        expect(received[0][0]).to.eql('api_facebook_request');
        expect(received[0][1]).to.eql('DTC');
        expect(received[0][2]).to.within(0, 100);
        expect(received[1]).to.eql([ 'apple', 'G', 2 ]);
        expect(received[2]).to.eql([ 'action', 'C', 2 ]);
        done();
      }, 1000);
    });
  });

  [undefined, true, false].forEach(function (finalize) {
    it('should ' + (finalize === false ? 'not ' : '') + 'finalize before disconnecting (' + finalize + ')', function (done) {
      expect(Knock.connect(socketFile)).to.eql(true);
      expect(Knock.gauge('apple', 2)).to.eql(true);

      wait(function () {
        expect(received).to.eql([]);
        Knock.disconnect(finalize);

        wait(function () {
          if (finalize === false) {
            expect(received).to.eql([]);
          } else {
            expect(received).to.eql([[ 'apple', 'G', 2 ]]);
          }
          done();
        }, 500);
      }, 500);

    });
  });

});