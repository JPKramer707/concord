const moduleName = 'noise';
const { NoiseCollector } = require('./NoiseCollector.class');
const { eventEmitter } = require('./eventEmitter');
const { store } = require('./store');
const {
	ENTROPY_LEVEL,
	NOISE_START,
	NOISE_SUSTAIN,
	NOISE_END
} = require('./constants').EVENTS;

const noise = {};
const noiseCollectorInstances = {};

const setup = () => {
	eventEmitter.on(
		ENTROPY_LEVEL,
		(user, entropyLevel, chunk) =>
			getNoiseCollectorInstanceByUserId(user.id)
				.addRecord({
					user,
					entropyLevel,
					chunk
				})
	);
};

const getNoiseCollectorInstanceByUserId = (userId) =>
	noiseCollectorInstances[userId]
		? noiseCollectorInstances[userId]
		: noiseCollectorInstances[userId] =
			(new NoiseCollector())
				.on('start', (record) => evt(NOISE_START, record))
				.on('sustain', (record) => evt(NOISE_SUSTAIN, record))
				.on('end', (record) => evt(NOISE_END, record))
		;

const evt = (evt, record) => {
	eventEmitter.emit(evt, record);
};

const getCollectionByUserId = (userId) => getNoiseCollectorInstanceByUserId(userId).getCollection();

const getIcons = (userId) => `${getCollectionByUserId(userId).slice(-1).current ? '🔊' : '🔈'}`;

exports.setup = setup;
exports.moduleName = moduleName;
exports.getIcons = getIcons;
exports.getCollectionByUserId = getCollectionByUserId;
