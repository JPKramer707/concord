const { ram } = require('./ram');
const { speak } = require('./speak');
const { client } = require("./client.js");

const mute = (connection, user, guildId) => muteUnmute(true, connection, user, guildId);
const unMute = (connection, user, guildId) => muteUnmute(false, connection, user, guildId);

const muteUnmute = (bool, connection, user, guildId) => {
	return false;
	if (bool) console.log('Muting...');

	client.editGuildMember(
	    guildId,
	    user.id,
	    { mute: bool },
	    'Citation #000'
	).then(() => {
	    const userRAM = ram.getUser(user);
	    userRAM.serverMute = bool;    
	    ram.setUser(userRAM);
	});

	//if (bool) speak(connection, 'click');
};

exports.mute = mute;
exports.unMute = unMute;
