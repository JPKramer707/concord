const { tc } = require('./tc');
const { client } = require("../craig/client.js");
const { throttle, debounce } = require('throttle-debounce');
const { store } = require('./store');
const { eventEmitter } = require('./eventEmitter');
store.registerModules([
	require('./test.module'),
	require('./delight.module'),
	require('./console.module'),
	require('./mute.module'),
]);
const {
    users, // Active users, by ID
    webUsers,  // Active web users, by username#web
    webPingers,  // Active ping connections, simply so we can close them when we're done with them
    userTrackNos,  // Track numbers for each active user
    userPacketNos,  // Packet numbers for each active user
    userRecentPackets,  // Recent packets, before they've been flushed, for each active non-web user
    corruptWarn,  // Have we warned about this user's data being corrupt?
    trackNo,  // Our current track number
    speakingRecords,
    speaking,
    mutes,
    size   // The amount of data I've recorded
} = store;

const regularlyThrottleTime = 250;

const concord = {
	start: (connection) => {
		store.setConnection(connection);
		store.setupModules();
		setInterval(() => eventEmitter.emit('regularly'), regularlyThrottleTime);
	},

	muteDisruptiveUsers: () => {
		const report = concord.getDisruptionReport();
		for (var x=0; x<report.disruption.length; x++) {
			concord.mute(report.disruption[x], report.disrupted.userId, report.disrupted.latestRecord.start);
		}

		// Attempt to unmute people
		const mutedUsers = Object.keys(mutes).filter(userId => store.isMuted(userId));
		for (var x=0; x<mutedUsers.length; x++) {
			const targetUserId = mutedUsers[x];
			const targetUser = store.getUserById(targetUserId);
			const muteRecord = mutes[targetUserId];
			const disruptedUserSpeakingRecord = store.getSpeakingRecordsByUserId(muteRecord.disrupted.userId).slice(-1)[0];
			if (typeof(disruptedUserSpeakingRecord) !== 'undefined') {
				if (!store.getSpeakingByUserId(muteRecord.disrupted.userId)) {
					// The disrupted user has finished their speech.
					concord.unMute(targetUserId);
				}
			}
		}
	},

	getDisruptionReport: () => {
		const sortedSpeakingRecords = store
			.whosTalkingNow()
			.map(userId => {
				return {
					userId,
					latestRecord: store.getSpeakingRecordsByUserId(userId).slice(-1)[0]
				};
			})
			.sort(
				(record1, record2) => Number(
					BigInt(record1.latestRecord.start) - BigInt(record2.latestRecord.start)
				)
			);
		return {
			disrupted: sortedSpeakingRecords[0],
			disruption: sortedSpeakingRecords.slice(1).map(rec => rec.userId)
		};
	},

	onReceive: (user, chunk) => {
		eventEmitter.emit('receivePacket', user, chunk);
	},

	regularly: throttle(regularlyThrottleTime, () => {
		concord.muteDisruptiveUsers();
		eventEmitter.emit('regularly');
	}),

	tc: tc,
};

exports.concord = concord;
