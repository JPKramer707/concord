const EventEmitter = require('eventemitter3');
const { LOG } = require('./constants').EVENTS;
const { argsToArray } = require('./util');
const eventEmitter = new EventEmitter();

const log = function() { eventemitter3.emit(LOG, argsToArray(arguments, 0)); };

exports.eventEmitter = new EventEmitter();
exports.log = log;
