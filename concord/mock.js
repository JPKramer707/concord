const beforeAll = (store) => {
	jest
	    .spyOn(process.hrtime, 'bigint')
	    .mockImplementation(() => 25000000000n);

	jest
	    .spyOn(store, 'getUserById')
	    .mockImplementation(userId => {
		    return {
		        1: {
		            username: 'Davy Jones'
		        }
		    }[userId];
		});
};

const beforeEachx = (store) => {
	const userId = 1;
	store.addSpeakingRecord(userId, {
	    start: 1n,
	    end: 5000000000n
	});
	store.addSpeakingRecord(userId, {
	    start: 15000000000n,
	    end: 25000000000n
	});
};

exports.beforeEachx = beforeEachx;
exports.beforeAll = beforeAll;
