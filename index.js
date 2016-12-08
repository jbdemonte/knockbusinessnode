var unix = require('unix-dgram');

module.exports = Knock;

var BUFFER_LEN = 704;

function Knock(socketPath) {

  socketPath = socketPath || '/var/run/knockdaemon.udp.socket';
  var counters = {};
  var gauges = {};
  var delays = [];

  this.gauge = cleanDecorator(this, true, function (item, value) {
    gauges[item] = value;
  });

  this.increment = cleanDecorator(this, true, function (item, value) {
    counters[item] = (counters[item] || 0) + value;
  });

  this.start_delay = cleanDecorator(this, false, function (item) {
    return [item, time()];
  });

  this.stop_delay = function (timecode) {
    if (!Array.isArray(timecode) || timecode.length !== 2 || !isClean(timecode[0]) || !isNumeric(timecode[1])) {
      return false;
    }
    delays.push([timecode[0], 'DTC', time() - timecode[1]]);
    return true;
  };

  this.commit = function () {
    var items = delays.concat(
      Object.keys(gauges).map(function (name) {
        return [name, 'G', gauges[name]];
      }),
      Object.keys(counters).map(function (name) {
        return [name, 'C', counters[name]];
      })
    );

    // reset
    counters = {};
    gauges = {};
    delays = [];

    return send(socketPath, items);
  };

}

/**
 * Decorate a function with isClean
 * @param {object} self
 * @param {boolean} testValue
 * @param {function} fn
 * @return {Function}
 */
function cleanDecorator(self, testValue, fn) {
  return function (item, value) {
    if (isClean(item) && (!testValue || isNumeric(value))) {
      var result = fn.apply(self, arguments);
      return result === undefined || result;
    }
    return false;
  };
}

/**
 * Return True if the item is well formatted
 * @param {string} item
 * @return {boolean}
 */
function isClean(item) {
  return Boolean(item && typeof item === 'string' && item.length <= 70);
}

/**
 * Send data to the socket
 * @param {string} path
 * @param {Array} items
 * @return {number}
 */
function send(path, items) {
  var len = items.length;
  if (len) {
    var message;
    var client = unix.createSocket('unix_dgram');
    client.on('error', console.error);
    while (items.length) {
      message = Buffer(JSON.stringify(items.splice(0, BUFFER_LEN)));
      client.send(message, 0, message.length, path);
    }
    client.close();
  }
  return len;
}

/**
 * Return True if the value is a numeric
 * @param {*} value
 * @return {boolean}
 */
function isNumeric(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Return hrtime in ms
 * @return {number}
 */
function time() {
  var hrtime = process.hrtime();
  return hrtime[0] * 1e3 + hrtime[1] / 1e6;
}