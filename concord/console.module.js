const moduleName = 'console';
const { tc } = require('./tc');
const { throttle } = require('throttle-debounce');
const { store } = require('./store');
const { eventEmitter } = require('./eventEmitter');

const setup = () => {
	eventEmitter.on('regularly', () => tc(reportTalk));
};

const reportTalk = throttle(250, () => {
	const createBars = obj => {
		const count = Math.min(obj.count, obj.limit);
		const black = count;
		const white = obj.limit - count;
		return (
			(black
				? '▓'.repeat(black)
				: '')
			+
			(white
				? '░'.repeat(white)
				: '')
		);
	};

	//console.clear();
	console.log(
		new Date(),
		"\nAPI Courtesy",
		"\n   Mute: " + createBars(store.getAPIUsage().mute),
		"\n\n",
		"\nMessages:\n",
		store.getMessages().filter(
			message => message.time < (process.hrtime.bigint() * BigInt(1 * 1000 * 1000000))
		).slice(-15).map(
			message => `   ${message.time}: ${message.msg.substring(0,100)}`
		).join("\n"),
		"\n\n",
		Object.keys(store.getUsers()).map(
			userId => ({
				me: store.getUserById(userId),
				talking: store.getSpeakingByUserId(userId),
				muted: store.isMuted(userId)
			})
		).map(
			obj => `${obj.me.username} ${obj.muted ? '🔇' : obj.talking ? '🔊' : '🔈'}`
		).join("\n")
	);
});

const reportVars = () => {
	console.log(
		'Vars: ',
		users,
		webUsers,
		webPingers,
		userTrackNos,
		userPacketNos,
		userRecentPackets,
		corruptWarn,
		trackNo,
		startTime,
		size
	);
};

exports.setup = setup;
exports.moduleName = moduleName;
