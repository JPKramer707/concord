const moduleName = 'speech';
const { rebounce, overlap } = require('./util');
const { SpeechCollector } = require('./SpeechCollector.class');
const { eventEmitter } = require('./eventEmitter');
const { store } = require('./store');
const { speechDebounceTime } = require('./config');
const {
	ENTROPY_LEVEL,
	NOISE_START,
	NOISE_SUSTAIN,
	NOISE_END,
	SPEECH_START,
	SPEECH_SUSTAIN,
	SPEECH_END
} = require('./constants').EVENTS;

const speech = {};
const speechCollectorInstances = {};

const setup = () => {
	const addRecord = (record) => getSpeechCollectorInstanceByUserId(record.user.id).addRecord(record);
	eventEmitter
		.on(NOISE_START, addRecord)
		.on(NOISE_SUSTAIN, addRecord)
};

const getSpeechCollectorInstanceByUserId = (userId) =>
	speechCollectorInstances[userId]
		? speechCollectorInstances[userId]
		: speechCollectorInstances[userId] =
			(new SpeechCollector())
				.on('start', (record) => evt(SPEECH_START, record))
				.on('sustain', (record) => evt(SPEECH_SUSTAIN, record))
				.on('end', (record) => evt(SPEECH_END, record))
		;

const speechEnd = rebounce(
	0,
	speechDebounceTime,
	(userId) => getSpeechCollectorInstanceByUserId(userId).closeOpenRecord()
);

const evt = (evt, { user }) => {
	if (evt === SPEECH_START || evt === SPEECH_SUSTAIN) {
		// ℹ️ Counter-intuitive: noiseEnd() is debounced,
		// so in order to postpone its execution,
		// we must perpetually execute it.
		speechEnd(user.id);
	}
	eventEmitter.emit(evt, record.user, record.entropyLevel, record.chunk);
};

const getCollectionByUserId = (userId) => getSpeechCollectorInstanceByUserId(userId).getCollection();

const getIcons = (userId) => `${getCollectionByUserId(userId).slice(-1).current ? '😮' : '😐'}`;

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
			getCollectionByUserId(user.id).forEach(
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
exports.getCollectionByUserId = getCollectionByUserId;
exports.getTimeRangeReport = getTimeRangeReport;
