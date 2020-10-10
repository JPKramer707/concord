/*
	co·​in·​ci·​dence

    noun; The state or fact of occupying the same relative position or area in space.

    * The American Heritage® Dictionary of the English Language, 5th Edition.
*/
const moduleName = 'coincidence';
const { CoincidenceCollector } = require('./CoincidenceCollector.class');
const { eventEmitter } = require('./eventEmitter');
const {
	SPEECH_START, SPEECH_SUSTAIN, SPEECH_END,
	COINCIDENCE_START, COINCIDENCE_SUSTAIN, COINCIDENCE_END
 } = require('./constants').EVENTS;
const { store } = require('./store');

const setup = () => {
	CoincidenceCollector.setFactory((id) => {
		return (new CoincidenceCollector())
			.on('start', eventEmitter.emit(COINCIDENCE_START))
			.on('sustain', eventEmitter.emit(COINCIDENCE_SUSTAIN))
			.on('end', eventEmitter.emit(COINCIDENCE_END))
	});
	const eventHandler = (evt, record) => {
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
						CoincidenceCollector
							.getInstanceById(rec.user.id)
							.addRecord(rec);
						if (evt === SPEECH_START) {
							store.pushMessage(`Coincidence: ${rec.record.indices[0]}: ${rec.user.username}`);
						}
					}
				);
			}
		} catch(e) { console.error(e); }
	};
	eventEmitter
		.on(SPEECH_START, eventHandler.bind(null, SPEECH_START))
		.on(SPEECH_SUSTAIN, eventHandler.bind(null, SPEECH_SUSTAIN))
	;
};

exports.setup = setup;
exports.moduleName = moduleName;
