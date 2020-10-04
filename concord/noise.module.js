const moduleName = 'noise';
const { eventEmitter } = require('./eventEmitter');
const { store } = require('./store');
const { hrtimeToBigint } = require('./tc');

const threshhold = 45;
const noise = {};
const currentTemplate = {
	start: undefined,
	sustain: undefined,
	end: undefined
};

const setup = () => {
	eventEmitter.on('entropyLevel', processEntropy);
};

const processEntropy = (user, entropyLevel, chunk) => {
	ensureUserSetup(user);

	if (noise[user.id].current.start !== undefined) {
		if (entropyLevel < threshhold) {
			const record = {
				...noise[user.id].current,
				end: hrtimeToBigint(chunk.hrtime)
			};
			noise[user.id].history.push(record);
			noise[user.id].current = {
				...currentTemplate
			};
			eventEmitter.emit('noise-end', user, record);
		} else {
			noise[user.id].current.sustain = hrtimeToBigint(chunk.hrtime)
			eventEmitter.emit('noise-sustain', user, noise[user.id].current);
		}
	} else {
		if (entropyLevel > threshhold) {
			noise[user.id].current.start = hrtimeToBigint(chunk.hrtime)
			eventEmitter.emit('noise-start', user, noise[user.id].current);
		}
	}
};

const ensureUserSetup = (user) => {
	if (typeof(noise[user.id]) === 'undefined') {
		noise[user.id] = {
			current: { ...currentTemplate },
			history: []
		};
	}
};

const getIcons = (userId) => `${noise[userId].current.start ? '🔊' : '🔈'}`;

exports.setup = setup;
exports.moduleName = moduleName;
exports.getIcons = getIcons;
