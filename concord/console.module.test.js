const { generateUserSpeechHistory } = require('./console.module');
const { store } = require('./store');
const { beforeEachx, beforeAll } = require('./mock');
const userId = 1;

beforeAll(store);

test('generateUserSpeechHistory()', () => {
	store.addSpeakingRecord(userId, {
	    start: 1n,
	    end: 5000000000n
	});
	store.addSpeakingRecord(userId, {
	    start: 15000000000n,
	    end: 25000000000n
	});

    expect(generateUserSpeechHistory(userId, process.hrtime.bigint())).toBe(true);
});
