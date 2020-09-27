const { ram } = require("../ram.js");
const noiseDiscriminator = require("./noise").discriminator;
const discriminator = 'Crosstalk';
const disruptionThreshhold = 1000000;
var lastChunkTime = undefined;

const crossTalkDiscriminator = chunkTime => {
    lastChunkTime = chunkTime;
    const openFrames = getOpenFrames().sort((a,b) => hrtimeToBigint(a.timeStart) - hrtimeToBigint(b.timeStart));
    for (var x=1; x<openFrames.length; x++) {
        ram.updateFrame({
            ...openFrames[x],
            data: {
                ...openFrames[x].data,
                disruptive: true
            }
        });
    }
};

const getOpenFrames = () => {
    return ram.getFrames().filter(
        frame =>
            frame.discriminator === noiseDiscriminator &&
            frame.timeEnd === undefined
    );
}

const getDisruptiveFrames = () => {
    if (!lastChunkTime) {
        console.error('No last chunkTime');
        return [];
    }
    return ram.getFrames().filter(
        frame =>
            frame.discriminator === noiseDiscriminator &&
            frame.data.disruptive &&
            (
                hrtimeToBigint(
                    frame.timeEnd === undefined
                        ? lastChunkTime
                        : frame.timeEnd
                ) - hrtimeToBigint(frame.timeStart)
            ) < disruptionThreshhold
    );
}

const hrtimeToBigint = hrtime => {
    if (!hrtime) throw new Error('hrtime: ' + hrtime);
    return hrtime[0] * 1000000 + hrtime[1] / 1000;
};

exports.crossTalkDiscriminator = crossTalkDiscriminator;
exports.discriminator = discriminator;
exports.getDisruptiveFrames = getDisruptiveFrames;
