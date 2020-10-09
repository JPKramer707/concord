const { Collector } = require('./Collector.class');
const { hrtimeToBigint } = require('./util');

class CoincidenceCollector extends Collector {
	collect(record) {
		return true;
	}

	getValueFromRecord(record) {
		return record.record;
	}

	getIndexFromRecord(record) {
		return record.record.indices[0];
	}
}

exports.CoincidenceCollector = CoincidenceCollector;
