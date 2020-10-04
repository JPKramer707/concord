const { store } = require('./store');
const { beforeEachx, beforeAll } = require('./mock');
const userId = 1;
const {
    getUserSpeechBetweenTimes,
    getSpeakingRecordsByUserId,
} = store;

beforeAll(store);
beforeEach(beforeEachx.bind(null, store));

test('getUserSpeechBetweenTimes()', () => {
    expect(getSpeakingRecordsByUserId(userId).length).toBe(2);
    expect(getUserSpeechBetweenTimes(userId, 1n, 16n)).toBe(16);
    expect(getUserSpeechBetweenTimes(userId, 5000000000n, 20000000000n)).toBe(5000000002);
    expect(getUserSpeechBetweenTimes(userId, 1n, 50000000000n)).toBe(15000000001);
});
