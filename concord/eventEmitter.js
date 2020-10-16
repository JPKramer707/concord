const EventEmitter = require('eventemitter3');
const { LOG } = require('./constants').EVENTS;
const { argsToArray } = require('./util');

const eventEmitter = new EventEmitter();
const log = function() { eventEmitter.emit(LOG, argsToArray(arguments, 0)); };

exports.eventEmitter = eventEmitter;
exports.log = log;
