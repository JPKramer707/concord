const moduleName = 'speech';
const { eventEmitter } = require('./eventEmitter');
const { rebounce, overlap, tc } = require('./tc');
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
	speaking[user.id] = true;
	speech[user.id].current[startSustain] = record[startSustain];
	eventEmitter.emit('speech-'+startSustain, user, speech[user.id].current);

	// ℹ️ Counter-intuitive: noiseEnd() is rebounced,
	// so in order to postpone its execution,
	// we must perpetually execute it.
	noiseEnd(user, getCurrentSpeechByUserId(user.id));
	store.pushMessage(`Speech ${startSustain} ${speech[user.id].history.length}`);
};

const getCurrentSpeechByUserId = (userId) => {
	const userSpeech = speech[userId];
	if (!userSpeech || userSpeech.current.start === undefined) return false;
	return {
		...userSpeech.current,
		end: userSpeech.sustain || store.getTime()
	};
};

// ⚠️ It's dangerous to discriminate rebounces based on the entire
// user object, because data within may mutate, and in so doing
// redundant debounces may be created. This rebounce should be
// refactored to discriminate based only on user.id
const noiseEnd = rebounce(0, debounceTime, (user, record) => {
	const newRecord = getCurrentSpeechByUserId(user.id);
	speaking[user.id] = false;
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

const getSpeechByUserId = (userId) => {
	const items = (speech[userId]
		? [
			...speech[userId].history,
			getCurrentSpeechByUserId(userId)
		]
		: []);
	const preFilter = items.length;
	const newItems = items.filter(item => item.start !== undefined && item.end !== undefined);
	const postFilter = newItems.length;

	if (preFilter - postFilter > 0) console.warn(`Filtered ${preFilter - postFilter} items from getSpeechByUserId()`);
	return newItems;
};

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

	let rv = template.map(([t1, t2]) => ({
		timeRange: [t1, t2],
		reportTime: store.getTime(),
		speech: 0,
		sources: [],
		byUser: {}
	}));

	users.forEach(
		user => {
			getSpeechByUserId(user.id).forEach(
				speechItem => {
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
							//if (byUser[user.id]) debugger;
							try {
								const userTalkTime = overlap(
									time1, time2,
									speechItem.start, speechItem.end
								) + (byUser[user.id] || 0);
								const allTalkTime = speech + userTalkTime;
								//if (allTalkTime < userTalkTime) debugger;
								//if (byUser[user.id] > 0) debugger;
								const newSources = userTalkTime
									? [ ...sources, { speechItem, user } ]
									: [ ...sources ]
								return {
									timeRange: [ time1, time2 ],
									reportTime: store.getTime(),
									speech: allTalkTime,
									sources: newSources,
									byUser: {
										...byUser,
										[user.id]: userTalkTime
									}
								}
							} catch(e) {
								console.error(e);
							}

						}
					)
				}
			)
		}
	);

	if (!auditTimeRangeReport(rv).pass) console.warn(auditTimeRangeReport(rv));

	return rv;
};

const auditTimeRangeReport = report => {
	const auditResults = {
		pass: false,
		reportTime: 0,
		messages: [],
		data: []
	};
	report.map(
		({
			timeRange: [
				time1,
				time2
			],
			reportTime,
			sources,
			speech,
			byUser
		}, index) => {
			const rangeLength = Math.abs(time2 - time1);
			const userSpeechSum = Object.keys(byUser)
				.map(userId => byUser[userId])
				.reduce(
					(acc, speech) => acc + parseInt(speech), 0
				);
			const messages = [];

			const sourceReport = sources.reduce(
				(acc, {speechItem: { start, end }, user}) => ({
					startTooLate: acc.startTooLate + (start > time1) ? 1 : 0,
					endTooEarly: acc.endTooEarly + (end < time2) ? 1 : 0,
					totalSources: acc.totalSources + 1,
				}), { startTooLate: 0, endTooEarly: 0, totalSources: 0 }
			);
			if (sourceReport.startTooLate > 0) messages.push({ index, msg: `SOURCE REPORT: ${sourceReport.startTooLate} late starts. ${sourceReport.totalSources} total sources.`})
			if (sourceReport.endTooEarly > 0) messages.push({ index, msg: `SOURCE REPORT: ${sourceReport.endTooEarly} early ends. ${sourceReport.totalSources} total sources.`})
			if (Object.keys(byUser).length > 1) messages.push({ index, msg: `Too many users. ${Object.keys(byUser).join(', ')}`});
			if (speech > rangeLength) messages.push({ index, msg: `Speech time ${speech} > range time ${rangeLength}.`});
			if (userSpeechSum > rangeLength) messages.push({ index, msg: `User speech time ${userSpeechSum} > range time ${rangeLength}.`});
			if (speech !== userSpeechSum) messages.push({ index, msg: `Speech time ${speech} !== User speech time ${userSpeechSum}.`});
			auditResults.reportTime = reportTime;
			auditResults.data[index] = {
				index,
				timeRange: [ time1, time2 ],
				duration: (Math.abs(time1 - time2) / 1000000000) + ' seconds',
				secondsAgo: (Number(store.getTime()) - time1) / 1000000000,
				speech,
				sources,
				messages
			};
			auditResults.messages = [
				...auditResults.messages,
				...messages
			];
		}
	);
	auditResults.pass = !auditResults.messages.length;
	return auditResults;
};

const getIcons = (userId) => `${speaking[userId] ? '😮' : '😐'}`;

exports.setup = setup;
exports.moduleName = moduleName;
exports.getTimeRangeReport = getTimeRangeReport;
exports.getIcons = getIcons;
