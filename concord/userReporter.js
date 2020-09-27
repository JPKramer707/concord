const { switches } = require('./config');
const { ram } = require("./ram.js");
const { calculateEntropy } = require('entropy-delight/src/entropy_delight');

const userReporter = (user) => {
    try {
        const userRAM = ram.getUser(user);
        const { chunkStatistics } = userRAM;
        const slice = chunkStatistics.slice(-1)[0];
        console.log(slice);
        const { delightfulness } = slice;
        const sharingDelight = (switches.voiceAnalysisSharingDelight) ? slice.sharingDelight : '?';
        const delightfulnessRollingAverage = (switches.voiceAnalysisRollingAverage) ? slice.delightfulnessRollingAverage : '?';
        const { dominating, serverMute } = userRAM;
        const bar = (switches.serverConsoleVoiceBar) ? '█'.repeat(Math.max(0,(delightfulness-45))) : '';

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
            `${chunkStatistics.length} chunks `+
            (switches.serverConsoleVoiceBar
                ? bar
                : `${delightfulnessRollingAverage}/${delightfulness}`
            );
    } catch(e) {
        console.error(e);
    }
};

exports.userReporter = userReporter;
