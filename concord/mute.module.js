const moduleName = 'mute';
const { store } = require('./store');
const { setMute } = require('./actions');

const setup = () => {};

const mute = (userId, reasonUserId, reasonUserStartTime) => {
	return muteControl(userId, true, reasonUserId, reasonUserStartTime);
};

const unMute = (userId) => {
	return muteControl(userId, false);
};

const muteControl = (targetUserId, bool, reasonUserId, reasonUserStartTime) => {
	const guildId = store.getConnection().channel.guild.id;
	const targetUser = store.getUserById(targetUserId);

	// API Courtesy: Counter-redundancy
	if (store.isMuted(targetUserId) === bool) return false;

	// Mute recordkeeping
	if (bool) {
		concord.speaking(
			store.getTrackNoByUserId(targetUserId),
			false
		);
		store.setMuteByUserId(targetUserId, {
			time: process.hrtime.bigint(),
			disrupted: {
				userId: reasonUserId,
				startTime: reasonUserStartTime
			}
		});
	} else {
		store.setMuteByUserId(targetUserId, false);
	}

	setMute(
		guildId,
		targetUserId,
		{ mute: bool },
		'Development Testing'
	).then(() => {
		if (bool) {
			try {
				const trackNo = store.getTrackNoByUserId(targetUserId);
				concord.speaking(
					trackNo,
					false
				);
			} catch(e) {
				console.error(e);
			}
		}
	});
};

exports.setup = setup;
exports.mute = mute;
exports.unMute = unMute;
exports.moduleName = moduleName;
