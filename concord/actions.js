const moduleName = 'actions';
const { client } = require("../craig/client.js");
const { store } = require('./store');

const setMute = (guildId, userId, bool, reason) => {
	return store.allowAPIUsage('mute')
		? client.editGuildMember(
			guildId,
			userId,
			{ mute: bool },
			reason
		)
		: new Promise(() => {
			throw 'API Depleted';
		});
};

const setup = () => {};

exports.setup = setup;
exports.setMute = setMute;
exports.moduleName = moduleName;
