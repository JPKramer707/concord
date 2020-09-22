const fs = require('fs');
const { ram } = require("../ram.js");
const sampleCount = 2;
const sampleSize = 5;
const discriminator = 'Noise';
const state = {};
const dumpFile = `./${discriminator}.json`;
var dumpFileCounter = 0;
const delightThreshhold = 43;

const noiseDiscriminator = (user, chunk, chunkTime) => {
    state.user = user;
    state.chunks = ram.getChunks().filter(chunk => chunk.user.id === user.id).slice(-sampleCount*sampleSize);
    state.openFrames = getOpenFrames();
    //dumpToFile(divideArray(state.chunks));
    state.delightfulnessAverages = divideArray(state.chunks).map(
        sample => profileDelightfulness(sample)
    );

    const
        previousChunk = state.chunks.slice(-2,-1)[0],
        thisChunk = state.chunks.slice(-1)[0];

    if (previousChunk && thisChunk) {
        const
            previousDelight = previousChunk.delightfulness,
            thisDelight = thisChunk.delightfulness;

        if (thisDelight > delightThreshhold && previousDelight < delightThreshhold) {
            // Started talk
            ram.addFrame(
                thisChunk.chunkTime,
                user,
                discriminator,
                { noise: true }
            );
            dumpToFile(ram.getFrames());
        }
        if (thisDelight < delightThreshhold && previousDelight > delightThreshhold) {
            // Ended talk
            switch (state.openFrames.length) {
                case 0:
                    console.warn('No open frames??');
                break;
                case 1:
                    const frame = state.openFrames[0];
                    frame.timeEnd = thisChunk.chunkTime;
                    ram.updateFrame(frame);
                    dumpToFile(ram.getFrames());
                break;
                default:
                    console.warn('Multiple open frames');
                break;
            }
        }
    }
};

const getOpenFrames = () => {
    const { user } = state;
    return ram.getFrames().filter(
        frame =>
            frame.user &&
            frame.user.id === user.id &&
            frame.discriminator === discriminator &&
            frame.timeEnd === undefined
    );
}

const dumpToFile = data => {
    if (dumpFile) {
        try {
            fs.writeFile(dumpFile, JSON.stringify(data), {}, () => {});
        } catch(e) {
            console.error(e);
        }
    }
}

const divideArray = (arr) => {
    for (var x=0, rv=[]; x<sampleCount; x++) rv.push([]);

    for (var y=0; y<sampleCount; y++) {
        for (var x=0; x<sampleSize; x++) {
            const val = arr[x*y];
            if (val) rv[y].push(val);
        }
    }
    return rv;
}

const profileDelightfulness = sample => {
    return sample.reduce(
        (acc, chunk) =>
            acc + chunk.delightfulness
        , 0
    ) / sample.length;
}

exports.noiseDiscriminator = noiseDiscriminator;
exports discriminator = discriminator;
