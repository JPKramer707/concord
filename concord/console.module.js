const moduleName = 'console';
const chalk = require('chalk');
const pad = require('pad');
const { tc } = require('./util');
const { throttle } = require('throttle-debounce');
const { store } = require('./store');
const { eventEmitter } = require('./eventEmitter');
const constants = require('./constants');
const {
	ENTROPY_LEVEL,
	NOISE_START,
	NOISE_SUSTAIN,
	NOISE_END,
	RECEIVE_PACKET,
	SPEECH_START,
	SPEECH_SUSTAIN,
	SPEECH_END,
	REGULARLY,
	COMMAND,
	LOG
} = constants.EVENTS;
const { nsPerSec } = constants;

const speaking = {};
const noise = {};
const showHide = {
	clear: true,
	report: true,
	records: false
};
const settings = {
	incrementLengthSec: 0.25,
	reportLength: 50,
	throttleTime: 100
};

const setup = () => {
	eventEmitter
		.on(REGULARLY, () => tc(reportTalk))
		.on(SPEECH_END, (user) => speaking[user.id] = false)
		.on(SPEECH_START, (user) => speaking[user.id] = true)
		.on(COMMAND, onCommand)
		.on(LOG, (msg) => store.pushMessage(`🗒 ${msg}`))
	;
};

const onCommand = (cmd) => {
	switch (cmd[0]) {
		case 'toggle':
			if (Object.keys(showHide).indexOf(cmd[1]) !== -1) {
				showHide[cmd[1]] = !showHide[cmd[1]];
			}
		break;
		case 'set':
			if (Object.keys(settings).indexOf(cmd[1]) !== -1) {
				const argument = Number(cmd[2]) > 0 ? Number(cmd[2]) : cmd[2];
				settings[cmd[1]] = argument;
			}
		break;
	}
};

const reportTalk = throttle(settings.throttleTime, () => {
	const { reportLength, incrementLengthSec } = settings;
	const incrementLengthNs = nsPerSec * incrementLengthSec;
	const speechReport = store.getModule('speech').getTimeRangeReport(
		(new Array(reportLength))
			.fill()
			.map(
				(val, i) => [
					Number(store.getTime()) + (-i * incrementLengthNs),
					Number(store.getTime()) + ((-i * incrementLengthNs) - incrementLengthNs)
				]
			)
	);
	const nowHrtime = process.hrtime.bigint();
	const createBars = (num, limit) => {
		const count = Math.min(num, limit);
		const black = count;
		const white = limit - count;
		return (
			(black
				? '▓'.repeat(black)
				: '')
			+
			(white
				? '░'.repeat(white)
				: '')
		);
	};

	if (showHide['clear']) console.clear();
	if (showHide['report']) {
		console.log(
			"\nAPI Courtesy",
			"\n   Mute: " + createBars(store.getAPIUsage().mute.count, store.getAPIUsage().mute.limit),
			"\n\n",
			"\nSpeakers",
			"\n   " + store
				.getModule('speech')
				.getCurrentRecords()
				.map(
					({ userId }) => store.getUserById(userId).username
				).join(', '),
			"\n\n",
			"\nMessages:\n",
			store.getMessages().filter(
				message => message.time < (nowHrtime * BigInt(1 * 1000 * 1000000))
			).slice(-15).map(
				message => `   ${message.time / 1000000000n }: ${message.msg.toString().substring(0,100)}`
			).join("\n "),
			"\n\n",
			Object.keys(store.getUsers()).map(
				userId => `${pad(20, store.getUserById(userId).username)}` +
					' ' +
					store.getModule('speech').getIcons(userId) +
					' ' +
					store.getModule('noise').getIcons(userId) +
					' ' +
					speechReport.map(
						record => {
							if (showHide['records']) console.log(record);
							const ns = record.byUser[userId];
							if (ns >= incrementLengthNs/1.5) return chalk.yellow('█');
							if (ns >= incrementLengthNs/2.5) return '▓';
							if (ns >= incrementLengthNs/3.5) return '▒';
							if (ns >= incrementLengthNs/4.5) return '░';
							if (ns > 0) return '·';
							return '-';
						}
					).join('') +
					' ' +
					speechReport.reduce(
						(acc, rec) => acc + rec.byUser[userId], 0
					) / speechReport.length + ' speech avg'
			).join("\n ")
		);
	}
});

exports.setup = setup;
exports.moduleName = moduleName;
