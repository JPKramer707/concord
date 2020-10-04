const moduleName = 'console';
const assert = require('assert').strict;
const pad = require('pad');
const { tc } = require('./tc');
const { throttle } = require('throttle-debounce');
const { store } = require('./store');
const { eventEmitter } = require('./eventEmitter');
const throttleTime = 100;
const ns = 1000000; // (ns) Nanosecond factor (one milisecond denominated in nanoseconds)
const speechHistoryDisplayWidthChars = 100;
const speechHistoryCharDurationNs = 25 * ns; // (ns) Each character in the graph covers this many nanoseconds time

const speaking = {};
const noise = {};

const setup = () => {
	eventEmitter
		.on('regularly', () => tc(reportTalk))
		.on('noise-end', (user) => noise[user.id] = false)
		.on('noise-start', (user) => noise[user.id] = true)
		.on('speech-end', (user) => speaking[user.id] = false)
		.on('speech-start', (user) => speaking[user.id] = true);
};

const generateUserSpeechHistory = (userId, nowHrtime) => {
	const me = store.getUserById(userId);
	return `${pad(20, me.username)} ` +
		`${noise[me.id] ? '🔊' : '🔈'}` +
		`${speaking[me.id] ? '😮' : '😐'} ` +
		(new Array(speechHistoryDisplayWidthChars))
		.fill(0, 0, speechHistoryDisplayWidthChars)
		.map(
			(val, index, arr) => {
				const targetIndex = arr.length - index;
				const t1 = BigInt(speechHistoryCharDurationNs * (targetIndex - 1));
				const t2 = BigInt(speechHistoryCharDurationNs * (targetIndex + 0));
				const x = tc(() => store.getUserSpeechBetweenTimes(
					userId,
					nowHrtime - t1,
					nowHrtime - t2,
					speechHistoryCharDurationNs
				));

				//               01234567
				const symbols = '·░▒▓█xyz'.split('');
				var symCount = 0;
				if (x >= speechHistoryCharDurationNs) { // 0
					return symbols[1]; // silence
				} else if (x > 0) {
					return symbols[2];
				} else {
					return symbols[4]; // Noise
				}
				symCount++;
				if (x > speechHistoryCharDurationNs / 1) return symbols[symCount]; // 1
				symCount++;
				if (x > speechHistoryCharDurationNs) return symbols[symCount]; //2
				symCount++;
				if (x > speechHistoryCharDurationNs / 1.1) return symbols[symCount]; //3
				symCount++;
				if (x > speechHistoryCharDurationNs / 1.2) return symbols[symCount];//4
				symCount++;
				if (x == 0) return symbols[symCount];//5
				symCount++;
				return symbols[symCount++];//6
			}
		).reverse().join('');
};

const reportTalk = throttle(throttleTime, () => {
	const reportLength = 50;
	const incrementLengthNs = 1000000000 * 0.25;
	const speechReport = store.getModule('speech').getTimeRangeReport(
		(new Array(reportLength))
			.fill()
			.map(
				(val, i) => [
					Number(store.getTime()) + (-i * incrementLengthNs),
					Number(store.getTime()) + ((-i * incrementLengthNs) - incrementLengthNs)
				]
			)
	);
	const nowHrtime = process.hrtime.bigint();
	const createBars = (num, limit) => {
		const count = Math.min(num, limit);
		const black = count;
		const white = limit - count;
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

	console.clear();
	console.log(
		new Date(),
		"\nAPI Courtesy",
		"\n   Mute: " + createBars(store.getAPIUsage().mute.count, store.getAPIUsage().mute.limit),
		"\n\n",
		"\nMessages:\n",
		store.getMessages().filter(
			message => message.time < (nowHrtime * BigInt(1 * 1000 * 1000000))
		).slice(-15).map(
			message => `   ${message.time}: ${message.msg.toString().substring(0,100)}`
		).join("\n"),
		"\n\n",
		Object.keys(store.getUsers()).map(
			userId => `${store.getUserById(userId).username} ` +
			speechReport.map(
				record => record.byUser[userId] > 0 ? '▓' : '░'
			).join('')
		).join("\n")

					/*
					talking = store.getSpeakingByUserId(userId);
					muted: store.isMuted(userId)
						}
					).map(
						obj => `${obj.me.username} ${obj.muted ? '🔇' : obj.talking ? '🔊' : '🔈'}`
								*/
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
exports.generateUserSpeechHistory = generateUserSpeechHistory;
