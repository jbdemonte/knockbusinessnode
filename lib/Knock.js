var unix = require('unix-dgram');
var EventEmitter = require('events');
var util = require('util');
var Timecode = require('./Timecode');

/**
 * Knock class
 * @param {object} defaults
 * @param {string} defaults.socketFile
 * @param {number} defaults.intervalTime
 * @param {number} defaults.bufferLen
 * @constructor
 */
function Knock(defaults) {
  var self = this;
  var counters, gauges, delays, client, connected, connecting, timer, intervalTime;

  EventEmitter.call(self);

  self.reset = function () {
    counters = {};
    gauges = {};
    delays = [];
  };

  /**
   * Connect to the daemon
   * @param {string} [socketFile]
   * @return {boolean}
   */
  self.connect = function (socketFile) {
    if (connecting || connected) {
      return false;
    }
    connecting = true;
    client = unix.createSocket('unix_dgram');
    client.once('connect', function () {
      connected = true;
      connecting = false;
      self.emit('connected');
    });
    client.on('congestion', function (buffer) {
      client.once('writable', function () {
        client.send(buffer);
      });
    });
    client.on('error', function (error) {
      self.emit('error', error);
    });
    client.connect(socketFile || defaults.socketFile);
    return true;
  };

  /**
   * Commit data
   * @return {number} Return number of data to be sent
   */
  self.commit = commit;

  /**
   * Start autocommit
   * @param {number} [delay] - Delay in ms
   */
  self.autocommit = function (delay) {
    intervalTime = delay || defaults.intervalTime;
    clearInterval(timer);
    timer = setInterval(commit, intervalTime);
  };

  /**
   * Set gauge item to specified float value
   * @param {string} item - item name
   * @param {number} value
   */
  self.gauge = cleanDecorator(true, function (item, value) {
    gauges[item] = value;
  });

  /**
   * Increment item using specified float value
   * @param {string} item - item name
   * @param {number} value
   */
  self.increment = cleanDecorator(true, function (item, value) {
    counters[item] = (counters[item] || 0) + value;
  });

  /**
   * Start a DelayToCount
   * @param {string} item - item name
   * @return {Timecode}
   */
  self.start_delay = cleanDecorator(false, function (item) {
    return new Timecode(item);
  });

  /**
   * Stop a DelayToCount
   * @param {Timecode} timecode
   * @return {boolean}
   */
  self.stop_delay = function (timecode) {
    if (timecode instanceof Timecode) {
      delays.push([timecode.item(), 'DTC', timecode.time()]);
      return true;
    }
    return false;
  };

  /**
   * Disconnect from the Knock daemon
   * @param {boolean} [finalize=true]
   */
  self.disconnect = function (finalize) {
    clearInterval(timer);
    if (connected || connecting) {
      if (finalize !== false) {
        self.once('idle', close);
        if (commit()) {
          return;
        }
      }
    }
    close();
  };

  /**
   * Close the client
   */
  function close() {
    clearInterval(timer);
    if (connected || connecting) {
      client.close();
    }
    connecting = false;
    connected = false;
  }

  /**
   * Collect items and send them to the client
   * @return {number}
   */
  function commit() {
    var items = delays.concat(
      buildItems('G', gauges),
      buildItems('C', counters)
    );
    var len = items.length;
    if (len) {
      send(items);
    }
    self.reset();
    return len;
  }

  /**
   * Send items to the client
   * @param {Array} items
   */
  function send(items) {
    if (!items.length) {
      return self.emit('idle');
    }
    var msg = Buffer.from(JSON.stringify(items.splice(0, defaults.bufferLen)));
    function _send() {
      client.send(msg, function (err) {
        if (!err) {
          process.nextTick(function () {
            send(items);
          });
        } else if (err.code < 0) {
          self.emit('error', err);
        } else {
          client.once('writable', _send);
        }
      });
    }
    _send();
  }

  self.reset();
}

util.inherits(Knock, EventEmitter);

/**
 * Return an array of items extracted from an object
 * @param {string} descriptor
 * @param {object} container - hashmap to extract the items from
 * @return {Array}
 */
function buildItems(descriptor, container) {
  return Object.keys(container).map(function (name) {
    return [name, descriptor, container[name]];
  });
}

/**
 * Decorate a function with isClean
 * @param {boolean} testValue
 * @param {function} fn
 * @return {Function}
 */
function cleanDecorator(testValue, fn) {
  return function (item, value) {
    if (isClean(item) && (!testValue || isNumeric(value))) {
      var result = fn.apply(null, arguments);
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
  return item && typeof item === 'string' && item.length <= 70;
}

/**
 * Return True if the value is a numeric
 * @param {*} value
 * @return {boolean}
 */
function isNumeric(value) {
  return typeof value === "number" && Number.isFinite(value);
}

module.exports = Knock;