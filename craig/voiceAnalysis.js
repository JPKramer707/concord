const { ram } = require("./ram.js");
const opus = new (require("node-opus")).OpusEncoder(48000);
const { calculateEntropy } = require('entropy-delight/src/entropy_delight');

const voiceAnalysis = (user, chunk, chunkTime) => {
    const userRAM = ram.getUser(user);
    const avgDelightChunkSampleSize = 50;
    const delightToShare = 53;
    const decodedData = opus.decode(chunk, 960);
    const delightfulness = parseInt(calculateEntropy(decodedData).entropy * 10);
    userRAM.chunkStatistics.push({
        date: new Date(),
        sharingDelight: (
            userRAM.rollingAverageDelightfulness > delightToShare ||
            delightfulness > delightToShare
        ),
        chunkTime,
        delightfulness,
        delightfulnessRollingAverage: parseInt(
            userRAM.chunkStatistics.slice(-avgDelightChunkSampleSize).reduce(
                (sum, statistic) => sum + statistic.delightfulness, 0
            ) / avgDelightChunkSampleSize
        )
    });  
    ram.setUser(user, userRAM);

    return userRAM.chunkStatistics.slice(-1)[0];
};

exports.voiceAnalysis = voiceAnalysis;
