const { ram } = require('./ram');
const { mute, unMute } = require('./actions');
const { voiceAnalysis } = require('./voiceAnalysis')
const { domination } = require("./domination");
const { userReporter } = require("./userReporter");
const { speak } = require('./speak');
const { send } = require('./websocket');

const processChunk = (connection, user, chunk, chunkTime) => {
    // Perform entropy analysis
    const statistic = voiceAnalysis(user, chunk, chunkTime);

    // Broadcast statistics via websocket
    send(statistic);

    // Perform justice analysis
    try {
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
    } catch(e) {
        console.error(e);
    }

    // Report status to console
    const userReports = Object
        .keys(users)
        .slice(0,4)
        .map(userId => users[userId])
        .map(user => userReporter(user))
        .join('\t');

    //console.clear();
    const seconds = parseInt(parseFloat(chunkTime[0]+'.'+chunkTime[1])*10)/10;
    //console.log(`${seconds}S ${userReports}`);
}

exports.processChunk = processChunk;
exports.speak = speak;
