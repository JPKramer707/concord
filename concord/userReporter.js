const { ram } = require("./ram.js");
const { calculateEntropy } = require('entropy-delight/src/entropy_delight');
const displayBar = true;

const userReporter = (user) => {
    try {
        const userRAM = ram.getUser(user);
        const {
            sharingDelight,
            delightfulness,
            delightfulnessRollingAverage
        } = userRAM.chunkStatistics.slice(-1)[0];
        const { dominating, serverMute } = userRAM;
        const bar = '█'.repeat(Math.max(0,(delightfulness-45)));

        const emoji = serverMute
            ? '🤐'
            : (
                dominating
                    ? '😱'
                    : (
                        sharingDelight
                            ? '😮'
                            : '😐'
                    )
            );

        return ``+
            emoji+
            `${user.username}: `+
            (displayBar
                ? bar
                : `${delightfulnessRollingAverage}/${delightfulness}`
            );
    } catch(e) {
        console.error(e);
    }
};

exports.userReporter = userReporter;
