const fs = require('fs');
const RAM = {
    frame: {
        'nextId': 0,
        '*': {
            id: -1,
            timeStart: undefined,
            timeEnd: undefined,
            user: {},
            discriminator: '',
            data: {}
        },
        'collection': []
    },
    user: {
        '*': {
            rollingAverageDelightfulness: 0,
            dominating: false,
            userObject: {},
            chunkStatistics: []
        }
    }
};
const dumpFile = './ram.json';
let dumpFileCounter = 0;

const ram = {
    getChunks: () => {
        return ram
            .getUsers()
            .map(user => user.chunkStatistics)
            .flat(1);
    },

    addFrame: (timeStart, user, discriminator, data) => {
        return RAM.frame.collection.push({
            ...RAM.frame['*'],
            id: ram.getNextFrameId(),
            timeStart,
            user,
            discriminator,
            data
        });
    },

    getFrames: () => RAM.frame.collection,

    getUsers: () => Object.keys(RAM.user).filter(key => key !== '*'),

    getUser: (user) => {
        const userRam = (typeof(RAM.user[user.id]) === 'undefined')
            ? JSON.parse(JSON.stringify(RAM.user['*']))
            : RAM.user[user.id];
        userRam.user = user;
        return userRam;
    },

    setUser: (user, userRAM) => {
        RAM.user[user.id] = userRAM;

        if (dumpFile && dumpFileCounter++ % 50 === 49) {
            try {
                fs.writeFile(dumpFile, JSON.stringify(RAM), {}, () => {});
            } catch(e) {
                console.error(e);
            }
        }
    }
};

exports.RAM = RAM;
exports.ram = ram;