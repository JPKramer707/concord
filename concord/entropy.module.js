const moduleName = 'entropy';
const { eventEmitter } = require('./eventEmitter');
const opus = new (require("node-opus")).OpusEncoder(48000);
const { calculateEntropy } = require('entropy-delight');
const { hrtimeToBigint } = require('./util');
const {
	ENTROPY_LEVEL,
	RECEIVE_PACKET
} = require('./constants').EVENTS;

const entropy = [];

const setup = () => {
	eventEmitter.on(RECEIVE_PACKET, processPacket);
};

const processPacket = (user, chunk) => {
	const entropyLevel = getChunkEntropy(chunk);
	eventEmitter.emit(ENTROPY_LEVEL, user, entropyLevel, chunk);
	entropy.push({
		time: hrtimeToBigint(chunk.hrtime),
		entropy: entropyLevel
	});
};

const getChunkEntropy = (chunk) => {
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
		return parseInt(calculateEntropy(decodedData).entropy * 10);
	} catch(e) {
		console.error(e);
	}
};

exports.setup = setup;
exports.moduleName = moduleName;
