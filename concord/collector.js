const { store } = require('./store');
const clone = require('rfdc')();
const tryInvoke = require('try-invoke');
const recordIndices = {
	START: 0,
	SUSTAIN: 1,
	END: 2
};

class Collector {
	constructor(options) {
		this.recordTemplate = {
			indices: [/* start, sustain, end */],
			data: []
		};
		this.options = options || {};
		this.collection = [];
		this.currentRecord = undefined;
	}

	on(eventName, callback) {
		const eventName2 = 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
		this.options[eventName2] = callback;
		return this;
	}

	getCollection() {
		const current = this.currentRecord;
		const collection = [ ...this.collection ];
		if (current !== undefined) {
			collection.push({
				...current,
				current: true,
				indices: [
					current.indices[recordIndices.START],
					current.indices[recordIndices.SUSTAIN],
					current.indices[recordIndices.SUSTAIN]
				]
			});
		}
		return collection;
	}

	addRecord(record) {
		if (this.collect(record)) {
			tryInvoke(this.options.onAddRecord, null, [record]);
			const index = this.getIndexFromRecord(record);
			if (this.currentRecord === undefined) {
				tryInvoke(this.options.onStart, null, [record]);
				this.currentRecord = clone(this.recordTemplate);
				this.currentRecord.indices[recordIndices.START] = index;
			} else {
				tryInvoke(this.options.onSustain, null, [record]);
			}
			this.currentRecord.indices[recordIndices.SUSTAIN] = index;
			this.currentRecord.data[index] = record;
		} else {
			this.closeOpenRecord();
		}
	}

	closeOpenRecord() {
		if (this.currentRecord !== undefined) {
			this.currentRecord.indices[recordIndices.END] = this.currentRecord.indices[recordIndices.SUSTAIN];
			this.collection.push({ ...this.currentRecord });
			tryInvoke(this.options.onEnd, null, [this.currentRecord]);
			this.currentRecord = undefined;
		}
	}

	collect(record) {
		return this.getValueFromRecord(record) > 0;
	}

	getValueFromRecord(record) {
		return record.v;
	}

	getIndexFromRecord(record) {
		return record.i;
	}

	static getCollectionById(id) {
		return this.getInstanceById(id).getCollection();
	}

	static getInstanceById(id) {
		this.instances = this.instances || {};

		return (id !== undefined)
			? this.instances[id]
				? this.instances[id]
				: this.instances[id] = this.newInstance(id)
			: this.instances
	}

	static newInstance(id) {
		const factory = this.getFactory();
		if (factory === undefined) throw new Error('newInstance() can only be called after setFactory()');
		return factory(id);
	}

	static setFactory(factory) {
		this.factory = factory;
	}

	static getFactory() {
		return this.factory;
	}
};

exports.Collector = Collector;
