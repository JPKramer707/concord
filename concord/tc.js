// Simple try-catch wrapper
// Error visibility for development
const tc = (callback) => {
	try {
		return callback();
	} catch(e) {
		console.error(e);
	}
};

const argsToArray = (args, startIndex) => Array.prototype.slice.call(args, startIndex || 0);

const mathMax = function() {
	const sorter = (a,b) => Number(b) - Number(a);
	const numbers = argsToArray(arguments);
	return numbers.sort(sorter)[0];
};

const mathMin = function() {
	const sorter = (a,b) => Number(a) - Number(b);
	const numbers = argsToArray(arguments);
	return numbers.sort(sorter)[0];
};

const overlap = (a1, a2, b1, b2) => {
	if (a1 > b2 || a2 < b1) return 0;
	const c1 = mathMin(mathMax(a1, b1), a2);
	const c2 = mathMax(mathMin(a2, b2), a1);
	const rv = Number(c2 - c1) + 1;
	if (rv > 1000050000) console.log(c1, c2);
	return rv;
};

exports.tc = tc;
exports.overlap = overlap;
exports.mathMax = mathMax;
exports.mathMin = mathMin;
