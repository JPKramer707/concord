const {
	overlap,
	tc,
	argsToArray,
	hrtimeToBigint
} = require('./util');

var users = {},
	webUsers = {},
	webPingers = {},
	userTrackNos = {},
	userPacketNos = {},
	userRecentPackets = {},
	corruptWarn = {},
	connection = {},
	speaking = {},
	speakingRecords = {},
	mutes = {},
	trackNo = 1,
	size = 0,
	messages = [],
	metrics = {},
	callbacks = {
		onReceive: [],
		regularly: [],
	},
	startTime = 0n,
	modules = [],
	APIUsage = {
		'mute': {
			limit: 6,
			count: 0
		}
	};

const
	setStartTime = st => startTime = st instanceof Array
		? hrtimeToBigint(st)
		: st;

	getStartTime = () => startTime;

	getTime = () => process.hrtime.bigint() - startTime;

	allowAPIUsage = (category) => APIUsage[category].count++ <= APIUsage[category].limit,

	getAPIUsage = () => APIUsage,

	setConnection = (c) => connection = c,

	getConnection = () => connection,

	registerModules = (theseModules) => modules = [
		...modules,
		...theseModules
	],

	setupModules = () => modules.forEach(module => {
		pushMessage(`Setup ${module.moduleName}`);
		module.setup();
	}),

	getModule = (name) => modules.find(module => module.moduleName === name),

	getMessages = () => messages,

	pushMessage = msg => {
		messages.push({
			time: process.hrtime.bigint(),
			msg
		});
	},

	isMuted = userId => !!mutes[userId],

	getTrackNoByUserId = userId => userTrackNos[userId],

	getRecentPacketsByUserId = userId => userRecentPackets[userId] || [],

	// Returns the total ns during which this user spoke between the two reference times
	getUserSpeechBetweenTimes = (userId, hrtime1, hrtime2, maxduration) => {
		const now = process.hrtime.bigint();
		const x = getSpeakingRecordsByUserId(userId);
		var j = [];
		const y = x.reduce(
			(acc, rec) => {
				const overlapNs = overlap(
					hrtime1,
					hrtime2,
					rec.start,
					rec.end || now
				);
				j.push(Number(overlapNs));
				return acc + Number(overlapNs);
			}, 0
		);
		return y;
	},

	getUserById = userId => users[userId],

	getUsers = () => users,

	getUserByTrackNo = trackNo => getUserById(
		Object.keys(userTrackNos).reduce(
			(acc, userId) => userTrackNos[userId] === trackNo ? userId : acc,
			undefined
		)
	);

exports.store = {
	users,
	webUsers,
	webPingers,
	userTrackNos,
	userPacketNos,
	userRecentPackets,
	corruptWarn,
	startTime,
	connection,
	speaking,
	speakingRecords,
	mutes,
	trackNo,
	size,

	isMuted,
	getTrackNoByUserId,
	getRecentPacketsByUserId,
	getUserById,
	getUserByTrackNo,
	getMessages,
	pushMessage,
	registerModules,
	setupModules,
	allowAPIUsage,
	getAPIUsage,
	setConnection,
	getUsers,
	getUserSpeechBetweenTimes,
	setStartTime,
	getModule,
	getTime,
};
