const RAM = {
    user: {
        '*': {
            rollingAverageDelightfulness: 0,
            dominating: false,
            userObject: {},
            chunkStatistics: []
        }
    }
};

const ram = {
    getUsers: () => RAM.user.keys(),
    getUser: (user) => {
        const userRam = (typeof(RAM.user[user.id]) === 'undefined')
            ? JSON.parse(JSON.stringify(RAM.user['*']))
            : RAM.user[user.id];
        userRam.user = user;
        return userRam;
    },
    setUser: (user, userRAM) => {
        RAM.user[user.id] = userRAM;
    }
};

exports.RAM = RAM;
exports.ram = ram;