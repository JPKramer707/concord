const { overlap, tc, argsToArray } = require('./tc');

var users = {},
	webUsers = {},
	webPingers = {},
	userTrackNos = {},
	userPacketNos = {},
	userRecentPackets = {},
	corruptWarn = {},
	startTime = {},
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
	};
	modules = [],
	APIUsage = {
		'mute': {
			limit: 6,
			count: 0
		}
	};

const
	allowAPIUsage = (category) => APIUsage[category].count++ <= APIUsage[category].limit,

	getAPIUsage = () => APIUsage,

	setConnection = (c) => connection = c,

	getConnection = () => connection,

	createCallbackType = (type) => callbacks[type] = [],

	registerCallback = (type, cb) => callbacks[type].push(cb),

	runCallbacks = function(type) {
		callbacks[type].forEach(
			cb => cb.apply(
				null,
				argsToArray(arguments, 1)
			)
		)
	},

	registerModules = (theseModules) => modules = [
		...modules,
		...theseModules
	],

	setMuteByUserId = (userId, muteData) => mutes[userId] = muteData,

	setupModules = () => modules.forEach(module => module.setup()),

	setMetric = (type, value) => metrics[type] = value,

	getMetric = (type) => metrics[type],

	getMessages = () => messages,

	pushMessage = msg => {
		messages.push({
			time: process.hrtime.bigint(),
			msg
		});
	},

	setSpeaking = (userId, bool) => speaking[userId] = bool,

	// Returns an array of user IDs
	whosTalkingNow = () => Object.keys(users)
		.filter(
			userId => speakingRecords[userId]
				&& speakingRecords[userId].slice(-1).length === 1
				&& speakingRecords[userId].slice(-1)[0].end === undefined
		),

	isMuted = userId => !!mutes[userId],

	getTrackNoByUserId = userId => userTrackNos[userId],

	getSpeakingByUserId = userId => speaking[userId],

	getRecentPacketsByUserId = userId => userRecentPackets[userId] || [],

	getSpeakingRecordsByUserId = userId => speakingRecords[userId] || [],

	addSpeakingRecord = (userId, record) => {
		if (typeof(speakingRecords[userId]) === 'undefined') speakingRecords[userId] = [];
		speakingRecords[userId].push(record);
	},

	getLatestSpeakingRecord = (userId) => getSpeakingRecordsByUserId(userId).slice(-1)[0],

	editLatestSpeakingRecord = (userId, editor) => {
		const latest = speakingRecords[userId].slice(-1)[0];
		speakingRecords[userId][speakingRecords.length-1] = editor(latest);
	},

	// Returns the total ns during which this user spoke between the two reference times
	getUserSpeechBetweenTimes = (userId, hrtime1, hrtime2, maxduration) => {
		const now = process.hrtime.bigint();
		const x = getSpeakingRecordsByUserId(userId).slice(-100);
		const y = x.reduce((acc, rec) => acc +
			Number(tc(() => overlap(
				hrtime1,
				hrtime2,
				rec.start,
				rec.end || now
			)))
		, 0);
		//if (y > maxduration) debugger;
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
	getSpeakingByUserId,
	getRecentPacketsByUserId,
	getSpeakingRecordsByUserId,
	getUserById,
	getUserByTrackNo,
	getMessages,
	pushMessage,
	whosTalkingNow,
	registerCallback,
	setMetric,
	getMetric,
	runCallbacks,
	registerModules,
	setupModules,
	createCallbackType,
	addSpeakingRecord,
	getLatestSpeakingRecord,
	editLatestSpeakingRecord,
	setMuteByUserId,
	allowAPIUsage,
	getAPIUsage,
	setConnection,
	getUsers,
	setSpeaking,
	getUserSpeechBetweenTimes,
};
