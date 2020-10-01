// Simple try-catch wrapper
// Error visibility for development
const tc = (callback) => {
	try {
		callback();
	} catch(e) {
		console.error(e);
	}
};

exports.tc = tc;
