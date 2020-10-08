const { Collector } = require('./collector');
const { hrtimeToBigint } = require('./util');
const { noiseThreshhold } = require('./config');
const { store } = require('./store');

class NoiseCollector extends Collector {
	collect(record) {
		return this.getValueFromRecord(record) > noiseThreshhold;
	}

	getValueFromRecord(record) {
		return record.entropyLevel;
	}

	getIndexFromRecord(record) {
		return record.chunk.hrtime;
	}
}

exports.NoiseCollector = NoiseCollector;
