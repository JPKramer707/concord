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
const speechHistoryCharDurationNs = 50 * ns; // (ns) Each character in the graph covers this many nanoseconds time

const setup = () => {
	eventEmitter.on('regularly', () => tc(reportTalk));
};

const generateUserSpeechHistory = (userId, nowHrtime) => {
	const me = store.getUserById(userId);
	return `${pad(20, me.username)} ` +
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
					return symbols[4];
				} else if (x > 0) {
					return symbols[2];
				} else {
					return symbols[1];
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
			userId => generateUserSpeechHistory(userId, nowHrtime)
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
