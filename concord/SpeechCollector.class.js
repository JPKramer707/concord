const { Collector } = require('./Collector.class');
const { hrtimeToBigint } = require('./util');
const { store } = require('./store');

class SpeechCollector extends Collector {
	collect(record) {
		return true;
	}

	getValueFromRecord(record) {
		return record.chunk;
	}

	getIndexFromRecord(record) {
		return hrtimeToBigint(record.chunk.hrtime);
	}
}

exports.SpeechCollector = SpeechCollector;
