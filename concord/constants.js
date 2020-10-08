const EVENTS = {
	ENTROPY_LEVEL: 'entropyLevel',
	NOISE_START: 'noise-start',
	NOISE_SUSTAIN: 'noise-sustain',
	NOISE_END: 'noise-end',
	RECEIVE_PACKET: 'receivePacket',
	SPEECH_START: 'speech-start',
	SPEECH_SUSTAIN: 'speech-sustain',
	SPEECH_END: 'speech-end',
	REGULARLY: 'regularly',
	COMMAND: 'command',
	LOG: 'log'
};
const nsPerSec = 1000000000;

exports.EVENTS = EVENTS;
exports.nsPerSec = nsPerSec;
