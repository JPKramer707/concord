const { concord } = require('./concord');
const { client } = require("../craig/client.js");
jest.mock("../craig/client.js");
client.editGuildMember.mockResolvedValue({});

