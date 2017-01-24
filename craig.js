const fs = require("fs");
const Discord = require("discord.js");
const opus = require("node-opus");
const ogg = require("ogg");
const ogg_packet = require("ogg-packet");
const client = new Discord.Client();

function accessSyncer(file) {
    try {
        fs.accessSync(file);
    } catch (ex) {
        return false;
    }
    return true;
}

// Given a connection, our recording session proper
function newConnection(connection, id) {
    const receiver = connection.createReceiver();

    // Our input Opus streams by user
    var userOpusStreams = {};

    // Our output streams by user
    var userOggStreams = {};

    // Our current track number
    var trackNo = 1;

    // Set up our recording OGG header and data file
    var startTime = process.hrtime();
    var recFileBase = "rec/" + id + ".ogg";
    try { fs.mkdirSync("rec"); } catch (ex) {}

    // Set up our recording streams
    var recFHStream = fs.createWriteStream(recFileBase + ".header");
    var recFStream = fs.createWriteStream(recFileBase + ".data");
    var recOggHStream = new ogg.Encoder();
    recOggHStream.on("data", (chunk) => { recFHStream.write(chunk); });
    recOggHStream.on("end", () => { recFHStream.end(); });
    var recOggStream = new ogg.Encoder();
    recOggStream.on("data", (chunk) => { recFStream.write(chunk); });
    recOggStream.on("end", () => { recFStream.end(); });

    // Function to encode a single Opus chunk to the ogg file
    function encodeChunk(oggStream, chunk, packetNo) {
        var chunkTime = process.hrtime(startTime);
        var chunkGranule = chunkTime[0] * 48000 + ~~(chunkTime[1] / 20833.333);
        var oggPacket = new ogg_packet();
        oggPacket.packet = chunk;
        oggPacket.bytes = chunk.length;
        oggPacket.b_o_s = 0;
        oggPacket.e_o_s = 0;
        oggPacket.granulepos = chunkGranule;
        oggPacket.packetno = packetNo;
        oggStream.packetin(oggPacket);
        oggStream.flush(() => {});
    }

    // And receiver for the actual data
    receiver.on('opus', (user, chunk) => {
        var userStr = user.username + "#" + user.id;
        if (userStr in userOpusStreams) return;

        var opusStream = userOpusStreams[userStr] = receiver.createOpusStream(user);
        var userOggStream;
        if (!(userStr in userOggStreams)) {
            var serialNo = trackNo++;
            var userOggHStream = recOggHStream.stream(serialNo);
            userOggStream = recOggStream.stream(serialNo);
            userOggStreams[userStr] = userOggStream;

            // Put a valid Opus header at the beginning
            var opusEncoder = new opus.Encoder(48000, 1, 480);
            opusEncoder.on("data", (chunk) => {
                if (!chunk.e_o_s) {
                    chunk.granulepos = 0;
                    userOggHStream.write(chunk);
                }
            });
            opusEncoder.on("end", () => { userOggHStream.end(); });
            opusEncoder.write(Buffer.alloc(480*2));
            opusEncoder.end();
        }
        userOggStream = userOggStreams[userStr];

        // And then receive the real data into the data stream
        var oggStream = userOggStreams[userStr];
        var packetNo = 1;

        encodeChunk(userOggStream, chunk, 0);

        opusStream.on("data", (chunk) => {
            encodeChunk(userOggStream, chunk, packetNo++);
        });
        opusStream.on("end", () => {
            delete userOpusStreams[userStr];
        });
    });

    // When we're disconnected from the channel...
    connection.on("disconnect", () => {
        // Close all our OGG streams
        for (var user in userOggStreams)
            userOggStreams[user].end();
    });
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.username}!`);
});

const craigCommand = /^(:craig: |<:craig:[0-9]*> )([^ ]*) (.*)$/;

client.on('message', (msg) => {
    var cmd = msg.content.match(craigCommand);
    if (cmd === null) return;
    var op = cmd[2].toLowerCase();
    if (op === "join" || op === "record" || op === "rec" ||
        op === "leave" || op === "part") {
        var cname = cmd[3].toLowerCase();
        var found = false;
        if (!msg.guild)
            return;

        msg.guild.channels.every((channel) => {
            if (channel.type !== "voice")
                return true;

            if (channel.name.toLowerCase() === cname) {
                found = true;
                if (op === "join" || op === "record" || op === "rec") {
                    channel.join().then((connection) => {
                        // Make a random ID for it
                        var id;
                        do {
                            id = ~~(Math.random() * 1000000000);
                        } while (accessSyncer("rec/" + id + ".ogg.header"));

                        // Tell them
                        msg.author.send("Recording with ID " + id);

                        // Then start the connection
                        newConnection(connection, id);
                    }).catch((err) => {
                        msg.reply(cmd[1] + "<(Failed to join! " + err + ")");
                    });
                } else {
                    channel.leave();
                }
            }

            return true;
        });

        if (!found)
            msg.reply(cmd[1] + "<(What channel?)");
    }
});

client.login('MjcyOTM3NjA0MzM5NDY2MjQw.C2cQgg.KgqXiB_BJgdZmAuGY1_P837zwIU');
