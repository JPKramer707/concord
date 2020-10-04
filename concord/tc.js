const { debounce } = require('throttle-debounce');

// Simple try-catch wrapper
// Error visibility for development
const tc = (callback) => {
	try {
		return callback();
	} catch(e) {
		console.error(e);
		return () => {}
	}
};

// Debounce with DISCRIMINATION!
// "discrim" parameter INTEGER / ARRAY[INTEGER]
//      Index(es) of the arguments which should identify the debouncer to use
const rebouncers = {};
const rebounce = function(discrim, timeout, callback) {
	const discriminatorIndices = discrim instanceof Array ? discrim : [ discrim ];

	return function() {
		const rebouncerId = discriminatorIndices.reduce(
			(acc, index) => '' + acc + JSON.stringify(arguments[index]),
			callback.toString()
		);
		if (rebouncers[rebouncerId] === undefined) {
			rebouncers[rebouncerId] = debounce(timeout, callback);
		}
		return rebouncers[rebouncerId].apply(null, arguments);
	};
};

// Converts arguments to array
// Optionally slices the array
const argsToArray = (args, startIndex) => Array.prototype.slice.call(args, startIndex || 0);

// BigInt-safe Math.max()
const mathMax = function() {
	const sorter = (a,b) => Number(b) - Number(a);
	const numbers = argsToArray(arguments);
	return numbers.sort(sorter)[0];
};

// BigInt-safe Math.min()
const mathMin = function() {
	const sorter = (a,b) => Number(a) - Number(b);
	const numbers = argsToArray(arguments);
	return numbers.sort(sorter)[0];
};

// How many numbers does range A (a1-a2)
// have in common with range B? (b1-b2)
const overlap = (a1, a2, b1, b2) => {
	if (a1 > b2 || a2 < b1) return 0;
	const c1 = mathMin(mathMax(a1, b1), a2);
	const c2 = mathMax(mathMin(a2, b2), a1);
	const rv = Number(c2 - c1);
	return rv;
};

// This function does what it says on the tin.
// Craig uses old `process.hrtime()` arrays
// Concord uses new `process.hrtime.bigint()` bigints
const hrtimeToBigint = hrtime => hrtime instanceof Array ? (BigInt(hrtime[0]) * 1000000000n) + BigInt(hrtime[1]) : hrtime;

exports.tc = tc;
exports.overlap = overlap;
exports.mathMax = mathMax;
exports.mathMin = mathMin;
exports.hrtimeToBigint = hrtimeToBigint;
exports.rebounce = rebounce;
