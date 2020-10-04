const moduleName = 'speech';
const { eventEmitter } = require('./eventEmitter');
const { rebounce, overlap } = require('./tc');
const { store } = require('./store');

const debounceTime = 250;
const speech = {};
const speaking = {};
const currentTemplate = {
	start: undefined,
	sustain: undefined,
	end: undefined
};

const setup = () => {
	eventEmitter
		.on('noise-start', noise.bind(null, true))
		.on('noise-sustain', noise.bind(null, false))
		.on('noise-end', noiseEnd);
};

const noise = (startBool, user, record) => {
	ensureUserSetup(user);
	const startSustain = startBool ? 'start' : 'sustain';
	speech[user.id].current[startSustain] = record[startSustain];
	eventEmitter.emit('speech-'+startSustain, user, speech[user.id].current);

	// ℹ️ Counter-intuitive: noiseEnd() is rebounced,
	// so in order to postpone its execution,
	// we must perpetually execute it.
	noiseEnd(user, {
		...record,
		end: store.getTime()
	});
};

// ⚠️ It's dangerous to discriminate rebounces based on the entire
// user object, because data within may mutate, and in so doing
// redundant debounces may be created. This rebounce should be
// refactored to discriminate based only on user.id
const noiseEnd = rebounce(0, debounceTime, (user, record) => {
	const newRecord = {
		...speech[user.id].current,
		end: record.end
	};
	speech[user.id].history.push(newRecord);
	speech[user.id].current = { ...currentTemplate };
	eventEmitter.emit('speech-end', user, newRecord);
	store.pushMessage('Speech End ' + speech[user.id].history.length);
});

const ensureUserSetup = (user) => {
	if (typeof(speech[user.id]) === 'undefined') {
		speech[user.id] = {
			current: { ...currentTemplate },
			history: []
		};
	}
};

const getSpeechByUserId = (userId) => speech[userId] || [];

/*
	In
		[[1,2], [3,4], [5,6]]
	Out
		[
			{
				timeRange: [1,2],
				speech: 0,
				byUser: {
					'101010101': 0
				}
			}
		]
*/
const getTimeRangeReport = (template, userList) => {
	const users = userList !== undefined
		? userList instanceof Array
			? userList
			: [ userList ]
		: Object.keys(speech).map(store.getUserById);

	var rv = template.map(([t1, t2]) => ({
		timeRange: [t1, t2],
		speech: 0,
		byUser: {}
	}));

	users.forEach(
		user => {
			getSpeechByUserId(user.id).history.forEach(
				speech => {
					rv = rv.map(
						record => {
							const [ time1, time2 ] = record.timeRange;
							const userTalkTime = overlap(
								time1, time2,
								speech.start, speech.end
							);
							return {
								...record,
								speech: record.speech + userTalkTime,
								byUser: {
									...record.byUser,
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
exports.getTimeRangeReport = getTimeRangeReport;
