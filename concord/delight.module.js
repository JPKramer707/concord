const moduleName = 'delight';
const { store } = require('./store');
const { eventEmitter } = require('./eventEmitter');
const { debounce } = require('throttle-debounce');
const opus = new (require("node-opus")).OpusEncoder(48000);
const { calculateEntropy } = require('entropy-delight');

const delightfulnessThreshhold = 45;
const debouncers = [];
const debounceTime = 500;

const setup = () => {
	store.pushMessage(moduleName + ' setup');
	eventEmitter
		.on('receivePacket', delight)
		.on('detectNoise', debounceSpeaking)
};

const debounceSpeaking = (idx, bool) => {
	const user = store.getUserByTrackNo(idx);
	if (!debouncers[idx]) {
		debouncers[idx] = {
			speaking: debounce(
				debounceTime,
				() => {
					//store.pushMessage(`${user.username} 🔈`);
					speaking(idx, false);
				}
			)
		};
	}

	// Only register speech if they're not muted.
	if (bool && !store.isMuted(user.id)) {
		speaking(idx, true);
		//store.pushMessage(`${user.username} 🔊`);
		debouncers[idx].speaking();
	}
};

const speaking = (idx, on) => {
	const user = store.getUserByTrackNo(idx);
	const hrtime = process.hrtime.bigint();
	store.setSpeaking(user.id, on);

	if (on) {
		const latest = store.getLatestSpeakingRecord(user.id);
		if (latest !== undefined && latest.end === undefined) {
			store.editLatestSpeakingRecord(
				user.id,
				(record) => record.end = process.hrtime.bigint()
			);
		}
		if (latest !== undefined && latest.end === undefined) {
			debugger;
		}
		store.addSpeakingRecord(
			user.id,
			{
				start: hrtime,
				end: undefined
			}
		);
	} else {
		store.editLatestSpeakingRecord(
			user.id,
			(record) => record.end = process.hrtime.bigint()
		);
	}
	//concord.muteDisruptiveUsers();
};

const delight = (user, chunk) => {
	const chunks = store.getRecentPacketsByUserId(user.id);
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

	if (avgDelight > delightfulnessThreshhold && !store.isMuted(user.id)) {
		eventEmitter.emit('detectNoise', store.getTrackNoByUserId(user.id), true);
	}
};

exports.setup = setup;
exports.moduleName = moduleName;
