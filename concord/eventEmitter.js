const EventEmitter = require('eventemitter3');
class ConcordEventEmitter extends EventEmitter {};
const eventEmitter = new ConcordEventEmitter();

exports.eventEmitter = eventEmitter;
