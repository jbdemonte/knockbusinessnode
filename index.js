var Knock = require('./lib/Knock');

module.exports = new Knock({
  socketFile: '/var/run/knockdaemon.udp.socket',
  intervalTime: 5000,
  bufferLen: 50
});