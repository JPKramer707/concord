const { switches } = require('./config');
const { ram } = require('./ram');
const { mute, unMute } = require('./actions');
const { noiseDiscriminator } = require('./discriminator/noise');
const { crossTalkDiscriminator, getDisruptiveFrames } = require('./discriminator/crosstalk');
const { voiceAnalysis } = require('./voiceAnalysis');
const { domination } = require("./domination");
const { userReporter } = require("./userReporter");
const { speak } = require('./speak');
const { send } = require('./websocket');
var chunkCount = 0;
const runConsoleReporting = false;
var persistentMessage = '';
const setPersistentMessage = msg => {
    send({ message: persistentMessage });
    persistentMessage = msg;
};
var profiles = [];
const reportProfile = profile => profiles.push(profile);

const processChunk = (connection, users, user, chunk, chunkTime) => {
    // Policy: Don't interrupt
    // Discriminator: Did you talk?
    //      Delightfulness
    //      Noise
    //      Talk
    //      Crosstalk
    // Statistics: You interrupted
    // Actions: I do this when you interrupt
chunkCount++;
    const args = [ user, chunk, chunkTime ];

    // Perform entropy analysis
    const statistic = voiceAnalysis(...args);

    // Discriminators
    if (switches.noiseDiscriminator) noiseDiscriminator(...args);
    if (switches.crossTalkDiscriminator) crossTalkDiscriminator(chunkTime);
    
    // Broadcast statistics via websocket
    send({
        user: {
            id: statistic.user.id,
            username: statistic.user.username
        },
        chunkTime: statistic.chunkTime,
        delightfulness: statistic.delightfulness
    });

    if (switches.serverProfileReporting) {
        // Profile information
        const profile = {
            high: BigInt(0),
            low: BigInt(99999999999999),
            avg: BigInt(0)
        };
        for (var x=0; x<profiles.length; x++) {
            const total = profiles[x][1] - profiles[x][0];
            if (profile.high < total) profile.high = total;
            if (profile.low > total) profile.low = total;
            profile.avg += total;
        }
        if (profiles.length) profile.avg = profile.avg / BigInt(profiles.length);
        if (profiles.length > 1000) profiles = profiles.slice(-500);
        send({
            profile: {
                high: Number(profile.high),
                low: Number(profile.low),
                avg: Number(profile.avg)
            }
        });
    }

    if (switches.dominationCheck) {
        // Perform justice analysis
        const dom = domination(user);
        if (dom) {
            const { dominating } = ram.getUser(user);
            const guildId = connection.channel.guild.id;
            if (dominating) {
                mute(connection, user, guildId);
            } else {
                unMute(connection, user, guildId);
            }
        }
    }

    if (
        switches.serverConsoleReporting
        && chunkCount % 50 === 49
        && switches.voiceAnalysisSaveStatistics) {
        // Report status to console
        const userReports = Object
            .keys(users)
            .slice(0,4)
            .map(userId => users[userId])
            .map(user => userReporter(user))
            .join('\t');

        //console.clear();
        console.log(getDisruptiveFrames().map(frame => ({ u: frame.user.username, l: frame.data.length })));
        const seconds = parseInt(parseFloat(chunkTime[0]+'.'+chunkTime[1])*10)/10;
        console.log(`${seconds}S ${userReports}`);
        //console.log(persistentMessage);
    }
}

exports.processChunk = processChunk;
exports.speak = speak;
exports.setPersistentMessage = setPersistentMessage;
exports.websocketSend = send;
exports.reportProfile = reportProfile;
