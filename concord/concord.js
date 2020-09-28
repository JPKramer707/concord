const speaking = {};
const speakingRecords = {};
var _users,
	_webUsers,
	_webPingers,
	_userTrackNos,
	_userPacketNos,
	_userRecentPackets,
	_corruptWarn,
	_trackNo,
	_startTime,
	_size;

const concord = {
	start: () => {
		setInterval(concord.onReceive, 1000);
	},

	speaking: (idx, on) => {
		const user = concord.getUserByTrackNo(idx);
		speaking[user.id] = on;
		if (typeof(speakingRecords[user.id]) === 'undefined') speakingRecords[user.id] = [];
		if (on) {
			speakingRecords[user.id].push({
				start: process.hrtime.bigint(),
				end: undefined
			});
		} else {
			speakingRecords[user.id][speakingRecords[user.id].length-1].end = process.hrtime.bigint();
			console.log('Stopped talking: ', concord.getUserById(user.id), speakingRecords[user.id].slice(-1)[0].end);
		}
	},

	getSpeakingByUserId: userId => speaking[userId],

	getRecentPacketsByUserId: userId => _userRecentPackets[userId],

	getUserById: userId => _users[userId],

	getUserByTrackNo: trackNo => concord.getUserById(
		Object.keys(_userTrackNos).reduce(
			(acc, userId) => _userTrackNos[userId] === trackNo ? userId : acc,
			undefined
		)
	),

	getDisruptiveUsers: () => {
		const talkers = Object.keys(_users)
			.filter(userId => speakingRecords[userId].slice(-1)[0].end === undefined);
		//console.log('Talkers: ', talkers.map(talker => concord.getUserById(talker).username));
		const talkers2 = talkers
			.map(userId => ({ userId: userId, latest: speakingRecords[userId].slice(-1) }));
		talkers2[0].floor = true;
		console.log('Talkers2: ', talkers2.map(
			talker => ({
				floor: talker.floor,
				user: concord.getUserById(talker.userId).username,
				latestEnd: talker.latest.end
			})
		));
		const talkers3 = talkers2
			.sort((record1, record2) => record1.latest.start > record2.latest.start);

		//console.log(talkers.map(talker => concord.getUserById(talker).username + '\t' + speakingRecords[talker].slice(-1)[0].end));
		return talkers3.slice(0).map(talker => concord.getUserById(talker.userId));
	},

	onReceive: () => {
		//concord.reportVars();

		
		//console.clear();
		//console.log(concord.getRecentPacketsByUserId(Object.keys(_users)[0]));
		console.log('Disruptive: ', concord.getDisruptiveUsers().map(user => user.username));
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
		size
	) => {
		console.log('spying');
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
	},

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
