const fs = require('fs');
const { send } = require('./websocket');
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
            user: {},
            chunkStatistics: []
        }
    }
};
//const dumpFile = './ram.json';
let dumpFileCounter = 0;

const ram = {
    getChunks: () => {
        return ram
            .getUserIds()
            .map(userId => ram.getUserById(userId).chunkStatistics)
            .flat(1);
    },

    updateFrame: frame => {
        const index = RAM.frame.collection.findIndex(thatFrame => thatFrame.id === frame.id);
        RAM.frame.collection[index] = frame;
        send(ram.getFrames());
    },

    addFrame: (timeStart, user, discriminator, data) => {
        const newFrame = RAM.frame.collection.push({
            ...JSON.parse(JSON.stringify(RAM.frame['*'])),
            id: RAM.frame.nextId++,
            timeStart,
            user,
            discriminator,
            data
        });
        send(ram.getFrames());
        return newFrame;
    },

    getFrames: () => RAM.frame.collection,

    getUserIds: () => Object.keys(RAM.user).filter(key => key !== '*'),

    getUser: (user) => {
        const userRam = (typeof(RAM.user[user.id]) === 'undefined')
            ? JSON.parse(JSON.stringify(RAM.user['*']))
            : RAM.user[user.id];
        userRam.user = user;
        return userRam;
    },

    getUserById: (userId) => ram.getUser({ id: userId }),

    setUser: (user, userRAM) => {
        RAM.user[user.id] = userRAM;

        if (typeof(dumpFile) !== 'undefined' && dumpFileCounter++ % 50 === 49) {
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