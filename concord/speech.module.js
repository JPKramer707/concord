const moduleName = 'speech';
const { rebounce, overlap } = require('./util');
const { SpeechCollector } = require('./SpeechCollector.class');
const { eventEmitter } = require('./eventEmitter');
const { store } = require('./store');
const { speechDebounceTime } = require('./config');
const {
	NOISE_START,
	NOISE_SUSTAIN,
	NOISE_END,
	SPEECH_START,
	SPEECH_SUSTAIN,
	SPEECH_END
} = require('./constants').EVENTS;

const setup = () => {
	const speechEnd = rebounce(
		0,
		speechDebounceTime,
		(userId) => SpeechCollector.getInstanceById(userId).closeOpenRecord()
	);
	const eventHandler = (evt, record) => {
		const { user, entropyLevel, chunk } = record;
		if (evt === SPEECH_START || evt === SPEECH_SUSTAIN) {
			// ℹ️ Counter-intuitive: noiseEnd() is debounced,
			// so in order to postpone its execution,
			// we must perpetually execute it.
			speechEnd(user.id);
		}
		eventEmitter.emit(evt, user, entropyLevel, chunk);
	}
	SpeechCollector.setFactory((id) => (new SpeechCollector())
		.on('start', eventHandler.bind(null, SPEECH_START))
		.on('sustain', eventHandler.bind(null, SPEECH_SUSTAIN))
		.on('end', eventHandler.bind(null, SPEECH_END))
	);
	const addRecord = (record) => SpeechCollector.getInstanceById(record.user.id).addRecord(record);
	eventEmitter
		.on(NOISE_START, addRecord)
		.on(NOISE_SUSTAIN, addRecord)
	;
};

const getCollectionByUserId = (userId) => SpeechCollector.getCollectionById(userId);

const getCurrentRecords = () => {
	const instances = SpeechCollector.getInstances();
	if (!instances) return [];
	const userIds = Object.keys(instances);
	return userIds.map(
		userId => {
			const lastRecord = instances[userId].getCollection().slice(-1)[0];
			return lastRecord.current ? {
				userId: userId,
				record: lastRecord
			} : undefined;
		}
	).filter(
		record => record !== undefined
	);
};

const getIcons = (userId) => {
	const collection = SpeechCollector.getCollectionById(userId);
	return `${collection.length && collection.slice(-1)[0].current ? '😮' : '😐'}`
};

const getTimeRangeReport = (template, userList) => {
	const users = userList !== undefined
		? userList instanceof Array
			? userList
			: [ userList ]
		: Object.keys(store.getUsers());

	let rv = template.map(([t1, t2]) => ({
		timeRange: [t1, t2],
		reportTime: store.getTime(),
		speech: 0,
		sources: [],
		byUser: {}
	}));

	users.forEach(
		userId => {
			const user = store.getUserById(userId);
			SpeechCollector.getCollectionById(user.id).forEach(
				speechItem => {
					const [ start, sustain, end ] = speechItem.indices;
					rv = rv.map(
						({
							timeRange: [
								time1,
								time2
							],
							sources,
							reportTime,
							speech,
							byUser
						}) => {
							const userTalkTime = overlap(
								time1, time2,
								start, end
							) + (byUser[user.id] || 0);
							const allTalkTime = speech + userTalkTime;
							return {
								timeRange: [ time1, time2 ],
								speech: allTalkTime,
								byUser: {
									...byUser,
									[user.id]: userTalkTime
								}
							}
						}
					)
				}
			)
		}
	);

	return rv;
};

exports.setup = setup;
exports.moduleName = moduleName;
exports.getIcons = getIcons;
exports.getCollectionByUserId = SpeechCollector.getCollectionById;
exports.getTimeRangeReport = getTimeRangeReport;
exports.getCurrentRecords = getCurrentRecords;

