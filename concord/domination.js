const { ram } = require("./ram.js");

const domination = (user) => {
	try {
		const chunkSampleSize = 200;
		const expectedQuietFactor = chunkSampleSize * 0.1;
		const delightfulnessThreshhold = 53;
		const userRAM = ram.getUser(user);
		const { dominating, chunkStatistics } = userRAM;
		const chunkSamples = chunkStatistics.slice(-chunkSampleSize);
		if (chunkSamples.length < chunkSampleSize) return false; // Domination impossible, they haven't been monitored long enough yet.

	    const quietCount = parseInt(
	        chunkSamples.reduce(
	            (sum, statistic) => sum + (statistic.delightfulness < delightfulnessThreshhold ? 1 : 0), 0
	        )
	    );

	    userRAM.dominating = (quietCount < chunkSampleSize / expectedQuietFactor);
	    ram.setUser(userRAM);

	    // Return true if user's domination status changes
	    const rv = (userRAM.dominating !== dominating);
		return rv;
	} catch(e) {
		console.error(e);
	}
};

exports.domination = domination;