const { client } = require("../craig/client.js");
const { calculateEntropy } = require('entropy-delight');
const { throttle, debounce } = require('throttle-debounce');
const opus = new (require("node-opus")).OpusEncoder(48000);

var speaking = {};
var speakingRecords = {};
var mutes = {};
var _users,
	_webUsers,
	_webPingers,
	_userTrackNos,
	_userPacketNos,
	_userRecentPackets,
	_corruptWarn,
	_trackNo,
	_startTime,
	_size,
	_connection;

const debouncers = [];
const debounceTime = 500;
const delightfulnessThreshhold = 45;

// API Courtesy
var discordAPIMute = {
	count: 0,
	limit: 100
};
var discordAPIUnmute = {
	count: 0,
	limit: 100
};
var messages = [];
const pushMessage = msg => {
	messages.push({
		time: process.hrtime.bigint(),
		msg
	});
};

const concord = {
	start: () => {
		setInterval(concord.regularly, 1000);
	},

	debounceSpeaking: (idx, bool) => {
		const user = concord.getUserByTrackNo(idx);
		if (!debouncers[idx]) {
			debouncers[idx] = {
				speaking: debounce(
					debounceTime,
					() => {
						pushMessage(`${user.username} 🔈`);
						concord.speaking(idx, false);
					}
				)
			};
		}

		// Only register speech if they're not muted.
		if (bool && !concord.isMuted(user.id)) {
			concord.speaking(idx, true);
			pushMessage(`${user.username} 🔊`);
			debouncers[idx].speaking();
		}
	},

	speaking: (idx, on) => {
		const user = concord.getUserByTrackNo(idx);
		const hrtime = process.hrtime.bigint();
		speaking[user.id] = on;
		if (typeof(speakingRecords[user.id]) === 'undefined') speakingRecords[user.id] = [];

		if (on) {
			speakingRecords[user.id].push({
				start: hrtime,
				end: undefined
			});
		} else {
			speakingRecords[user.id][speakingRecords[user.id].length-1].end = process.hrtime.bigint();
		}
		concord.muteDisruptiveUsers();
	},

	getSpeakingByUserId: userId => speaking[userId],

	getRecentPacketsByUserId: userId => _userRecentPackets[userId] || [],

	getSpeakingRecordsByUserId: userId => speakingRecords[userId] || [],

	getUserById: userId => _users[userId],

	getUserByTrackNo: trackNo => concord.getUserById(
		Object.keys(_userTrackNos).reduce(
			(acc, userId) => _userTrackNos[userId] === trackNo ? userId : acc,
			undefined
		)
	),

	getTrackNoByUserId: userId => _userTrackNos[userId],

	// Returns an array of user IDs
	whosTalkingNow: () => Object.keys(_users)
		.filter(
			userId => speakingRecords[userId]
				&& speakingRecords[userId].slice(-1).length === 1
				&& speakingRecords[userId].slice(-1)[0].end === undefined
		),

	// --- Muting ---
	isMuted: userId => !!mutes[userId],

	mute: (targetUserId, reasonUserId, reasonUserStartTime) => {
		return concord.muteControl(targetUserId, true, reasonUserId, reasonUserStartTime);
	},

	unMute: (userId) => {
		return concord.muteControl(userId, false);
	},

	muteControl: (targetUserId, bool, reasonUserId, reasonUserStartTime) => {
		const guildId = _connection.channel.guild.id;
		const targetUser = concord.getUserById(targetUserId);
		const hasExceededAPICourtesy = () => bool
			? discordAPIMute.count > discordAPIMute.limit
			: discordAPIUnmute.count > discordAPIUnmute.limit;
		const trackAPICourtesy = () => bool
			? discordAPIMute.count++
			: discordAPIUnmute.count++;
		const currentMuteState = concord.isMuted(targetUserId);

		// API Courtesy: Counter-redundancy
		if (currentMuteState === bool) return false;

		// Mute recordkeeping
		if (bool) {
			concord.speaking(
				concord.getTrackNoByUserId(targetUserId),
				false
			);
			mutes[targetUserId] = {
				time: process.hrtime.bigint(),
				disrupted: {
					userId: reasonUserId,
					startTime: reasonUserStartTime
				}
			};
		} else {
			mutes[targetUserId] = false;
		}

		// API Courtesy: Critical throttling
		if (hasExceededAPICourtesy()) {
			return false;
		}
		// Usage tracking
		trackAPICourtesy();

		// API Performance
		client.editGuildMember(
			guildId,
			targetUserId,
			{ mute: bool },
			'Development Testing'
		).then(() => {
			if (bool) {
				try {
					const trackNo = concord.getTrackNoByUserId(targetUserId);
					concord.speaking(
						trackNo,
						false
					);
				} catch(e) {
					console.error(e);
				}
			}
		});
	},

	muteDisruptiveUsers: () => {
		const report = concord.getDisruptionReport();
		for (var x=0; x<report.disruption.length; x++) {
			concord.mute(report.disruption[x], report.disrupted.userId, report.disrupted.latestRecord.start);
		}

		// Attempt to unmute people
		const mutedUsers = Object.keys(mutes).filter(userId => concord.isMuted(userId));
		for (var x=0; x<mutedUsers.length; x++) {
			const targetUserId = mutedUsers[x];
			const targetUser = concord.getUserById(targetUserId);
			const muteRecord = mutes[targetUserId];
			const disruptedUserSpeakingRecord = concord.getSpeakingRecordsByUserId(muteRecord.disrupted.userId).slice(-1)[0];
			if (typeof(disruptedUserSpeakingRecord) !== 'undefined') {
				if (!concord.getSpeakingByUserId(muteRecord.disrupted.userId)) {
					// The disrupted user has finished their speech.
					concord.unMute(targetUserId);
				}
			}
		}
	},

	getDisruptionReport: () => {
		const sortedSpeakingRecords = concord
			.whosTalkingNow();
			.map(userId => {
				return {
					userId,
					latestRecord: concord.getSpeakingRecordsByUserId(userId).slice(-1)[0]
				};
			})
			.sort(
				(record1, record2) => Number(BigInt(record1.latestRecord.start) - BigInt(record2.latestRecord.start))
			);
		return {
			disrupted: sortedSpeakingRecords[0],
			disruption: sortedSpeakingRecords.slice(1).map(rec => rec.userId)
		};
	},

	onReceive: (user, chunk) => {
		concord.delight(user, chunk);
		concord.regularly();
	},

	regularly: () => {
		concord.muteDisruptiveUsers();
		concord.reportTalk();
	},

	delight: (user, chunk) => {
		const chunks = concord.getRecentPacketsByUserId(user.id);
		const avgDelight = chunks.reduce(
			(acc, thisChunk) => {
				var chunk = thisChunk;
				var delightfulness = 0;
				if (chunk.length > 4 && chunk[0] === 0xBE && chunk[1] === 0xDE) {
					// There's an RTP header extension here. Strip it.
					var rtpHLen = chunk.readUInt16BE(2);
					var off = 4;

					for (var rhs = 0; rhs < rtpHLen && off < chunk.length; rhs++) {
						var subLen = (chunk[off]&0xF)+2;
						off += subLen;
					}
					while (off < chunk.length && chunk[off] === 0)
						off++;
					if (off >= chunk.length)
						off = chunk.length;

					chunk = chunk.slice(off);
				}

				try {
					const decodedData = opus.decode(chunk, 960);
					delightfulness = parseInt(calculateEntropy(decodedData).entropy * 10);
				} catch(e) {
					console.error(e);
				}
				return acc + delightfulness;
			},
			0
		) / chunks.length;

		if (avgDelight > delightfulnessThreshhold && !concord.isMuted(user.id)) {
			concord.debounceSpeaking(
				concord.getTrackNoByUserId(user.id),
				true
			);
		}
	},

	spy: (
		users,
		webUsers,
		webPingers,
		userTrackNos,
		userPacketNos,
		userRecentPackets,
		corruptWarn,
		trackNo,
		startTime,
		size,
		connection
	) => {
		_users = users;
		_webUsers = webUsers;
		_webPingers = webPingers;
		_userTrackNos = userTrackNos;
		_userPacketNos = userPacketNos;
		_userRecentPackets = userRecentPackets;
		_corruptWarn = corruptWarn;
		_trackNo = trackNo;
		_startTime = startTime;
		_size = size;
		_connection = connection;
		speaking = {};
		speakingRecords = {};
	},

	reportTalk: throttle(250, () => {
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
			"\n   Mute: " + createBars(discordAPIMute),
			"\nUn-mute: " + createBars(discordAPIUnmute),
			"\n\n",
			"\nMessages:\n",
			messages.filter(
				message => message.time < (process.hrtime.bigint() * BigInt(1 * 1000 * 1000000))
			).slice(-15).map(
				message => `   ${message.time}: ${message.msg.substring(0,100)}`
			).join("\n"),
			"\n\n",
			Object.keys(_users).map(
				userId => ({
					me: concord.getUserById(userId),
					talking: concord.getSpeakingByUserId(userId),
					muted: concord.isMuted(userId)
				})
			).map(
				obj => `${obj.me.username} ${obj.muted ? '🔇' : obj.talking ? '🔊' : '🔈'}`
			).join("\n")
		);
	}),

	reportVars: () => {
		console.log(
			'Vars: ',
			_users,
			_webUsers,
			_webPingers,
			_userTrackNos,
			_userPacketNos,
			_userRecentPackets,
			_corruptWarn,
			_trackNo,
			_startTime,
			_size
		);
	},

	tc: (callback) => {
		try {
			callback();
		} catch(e) {
			console.error(e);
		}
	}
};

exports.concord = concord;
