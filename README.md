Knock Probes
================

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Package Quality][quality-image]][quality-url] [![Coverage Status][coverage-image]][coverage-url]


This library contains a class to send business probe to knock daemon.

https://knock.center

# Requirements

- Knockdaemon
- An account on [Knock](https://knock.center)


# Example

## Installation

```bash
npm install knockprobe
```

## Push a Gauge Probe
You can push a gauge probe one by one without declare first.

```javascript
var Knock = require('knockprobe'); 
var k = new Knock();

k.gauge('apple', 2);
k.gauge('orange', 3);

k.commit();
```

## Push a Counter Probe
You can push a increment probe.

```javascript
var Knock = require('knockprobe'); 
var k = new Knock();

k = new Knock();
k.increment('action1', 1);

k.commit();
```

## Delay to Count

Delay to count is a spécial probe. This probe agregate all execution time in a dict of range of time.

```javascript
var Knock = require('knockprobe'); 
var k = new Knock();

k = new Knock();
timecode = k.start_delay('api_facebook_request');
// do something
k.stop_delay(timecode);

k.commit();
```

## Commit

All data are sent calling `commit` command.  
You can commit after each update or use your own scheduler to do it. 


[npm-url]: https://npmjs.org/package/knockprobe
[npm-image]: https://badge.fury.io/js/knockprobe.svg

[travis-url]: http://travis-ci.org/jbdemonte/knockbusinessnode
[travis-image]: https://secure.travis-ci.org/jbdemonte/knockbusinessnode.png?branch=master

[coverage-url]: https://coveralls.io/github/jbdemonte/knockbusinessnode?branch=master
[coverage-image]: https://coveralls.io/repos/jbdemonte/knockbusinessnode/badge.svg?branch=master&service=github

[quality-url]: http://packagequality.com/#?package=knockprobe
[quality-image]: http://npm.packagequality.com/shield/knockprobe.svg