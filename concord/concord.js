const { tc } = require('./tc');
const { store } = require('./store');
const { eventEmitter } = require('./eventEmitter');

store.registerModules([
	require('./entropy.module'),
	require('./noise.module'),
	require('./speech.module'),
	require('./console.module'),
	require('./mute.module'),
]);

const regularlyInterval = 250;

const concord = {
	start: (connection, startTime) => {
		store.setConnection(connection);
		store.setStartTime(startTime);
		store.setupModules();
		setInterval(() => eventEmitter.emit('regularly'), regularlyInterval);
	},

	onReceive: (user, chunk) => eventEmitter.emit('receivePacket', user, chunk),

	tc: tc,
};

exports.concord = concord;
