/*
	co·​in·​ci·​dence

    noun; The state or fact of occupying the same relative position or area in space.

    * The American Heritage® Dictionary of the English Language, 5th Edition.
*/
const moduleName = 'coincidence';
const { CoincidenceCollector } = require('./CoincidenceCollector.class');
const { eventEmitter } = require('./eventEmitter');
const { SPEECH_START, SPEECH_SUSTAIN, SPEECH_END } = require('./constants').EVENTS;
const { store } = require('./store');

const setup = () => {
	const addRecord = (record) => CoincidenceCollector.getInstanceById(record.user.id).addRecord(record);
	const eventHandler = (record) => {
		try {
			const currentRecords = store
				.getModule('speech')
				.getCurrentRecords()
				.map(
					({ userId, record }) => ({
						user: store.getUserById(userId),
						record
					})
				)
				.sort((a,b) => {
					if (a.record.indices[0] > b.record.indices[0]) return 1;
					if (a.record.indices[0] < b.record.indices[0]) return -1;
					return 0;
				});

			if (currentRecords.length > 1) {
				// Coincidence detected
				currentRecords.slice(1).forEach(
					rec => {
						CoincidenceCollector.getInstanceById(record.user.id).addRecord(rec);
						store.pushMessage(`${rec.record.indices[0]}: ${rec.user.username}`)
					}
				);
			}
		} catch(e) { console.error(e); }
	};
	eventEmitter
		.on(SPEECH_START, eventHandler)
		.on(SPEECH_SUSTAIN, eventHandler)
	;
};

exports.setup = setup;
exports.moduleName = moduleName;
