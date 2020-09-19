const { ram } = require("./ram.js");
const { calculateEntropy } = require('entropy-delight/src/entropy_delight');

const userReporter = (user) => {
    try {
        const userRAM = ram.getUser(user);
        const {
            sharingDelight,
            delightfulness,
            delightfulnessRollingAverage
        } = userRAM.chunkStatistics.slice(-1)[0];
        const { dominating } = userRAM;

        return ``+
            (
                dominating
                    ? '😱'
                    : (
                        sharingDelight
                            ? '😮'
                            : '😐'
                    )
            )+
            ' '+
            `${user.username}: `+
            `${delightfulnessRollingAverage}/${delightfulness}`;
    } catch(e) {
        console.error(e);
    }
};

exports.userReporter = userReporter;
