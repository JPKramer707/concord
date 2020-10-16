const { tc } = require('./util');
const { store } = require('./store');
const { eventEmitter, log } = require('./eventEmitter');
const { regularlyInterval } = require('./config');
const {
	REGULARLY,
	RECEIVE_PACKET,
	COMMAND
} = require('./constants').EVENTS;

store.registerModules([
	require('./entropy.module'),
	require('./noise.module'),
	require('./speech.module'),
	require('./console.module'),
	require('./coincidence.module'),
]);

const concord = {
	start: (connection, startTime) => {
		store.setConnection(connection);
		store.setStartTime(startTime);
		store.setupModules();
		setInterval(() => eventEmitter.emit(REGULARLY), regularlyInterval);
		eventEmitter.on(COMMAND, store.pushMessage);
		log('Concord Start');
	},

	onCommand: (msg) => eventEmitter.emit(COMMAND, msg),

	onReceive: (user, chunk) => eventEmitter.emit(RECEIVE_PACKET, user, chunk),

	tc: tc,
};

exports.concord = concord;
exports.log = log;
