Knock Probes
================

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Package Quality][quality-image]][quality-url] [![Coverage Status][coverage-image]][coverage-url]


This library contains a class to send business probe to knock daemon.

https://knocKnock.center

# Requirements

- NodeJS +4.6
- Knockdaemon installed
- An account on [Knock](https://knocKnock.center)

# Install

```bash
npm install knockprobe
```

# Type of probe

## Gauge
A simple counter, storing a current instant value. Last value provided wins.
Gauges are used in quantity cases. For example, a gauge could be defined by the amount of basket being processed.

## Increment
A simple counter, storing cumulative values and graphing them as delta per second.
Increment is typically an recurrent event. For example, an increment could be defined by the number of basket validated.

## Delay
A simple counter, storing execution time and graphing them by execution time interval.
For example, a delay could be defined by the time of execution of external request.


# Example

## Connect
Connect to the Knock daemon first.

```javascript
var Knock = require('knockprobe');
Knock.connect();
```

## Push a Gauge Probe
You can push a gauge probe one by one without declaring it first.

```javascript
Knock.gauge('apple', 2);
Knock.gauge('orange', 3);
Knock.commit();
```

## Push a Counter Probe
You can push an increment probe.

```javascript
Knock.increment('action1', 1);
Knock.commit();
```

## Delay to Count

Delay to count is a special probe. This probe aggregate all execution time in a dictionnary of range of time.

```javascript
var timecode = Knock.start_delay('api_facebook_request');
// do something
Knock.stop_delay(timecode);
Knock.commit();
```

## Commit

All data are sent calling `commit` command.
You also can use the autocommit feature:

```javascript
Knock.autocommit(2000); // commit will be called each 2000ms
```

## Disconnecting

When disconnecting, a disableable commit is processed first.
```javascript
Knock.disconnect();
// or
Knock.disconnect(false); // do not commit latest data
```

[npm-url]: https://npmjs.org/package/knockprobe
[npm-image]: https://badge.fury.io/js/knockprobe.svg

[travis-url]: http://travis-ci.org/jbdemonte/knockbusinessnode
[travis-image]: https://secure.travis-ci.org/jbdemonte/knockbusinessnode.png?branch=master

[coverage-url]: https://coveralls.io/github/jbdemonte/knockbusinessnode?branch=master
[coverage-image]: https://coveralls.io/repos/jbdemonte/knockbusinessnode/badge.svg?branch=master&service=github

[quality-url]: http://packagequality.com/#?package=knockprobe
[quality-image]: http://npm.packagequality.com/shield/knockprobe.svg