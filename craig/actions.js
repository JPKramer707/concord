const Discord = require("discord.js");

const mute = (user, guild) => {
	console.log(
		JSON.stringify(user),
		JSON.stringify(guild)
	);
};

exports.mute = mute;
