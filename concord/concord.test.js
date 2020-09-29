const { concord } = require('./concord');
const { client } = require("../craig/client.js");
jest.mock("../craig/client.js");
client.editGuildMember.mockResolvedValue({});

const {
    users,
    webUsers,
    webPingers,
    userTrackNos,
    userPacketNos,
    userRecentPackets,
    corruptWarn,
    trackNo,
    startTime,
    size,
    connection
} = require('./concordTestData.js');
var bob, sue;

beforeEach(() => {
    concord.spy(
        users,
        webUsers,
        webPingers,
        userTrackNos,
        userPacketNos,
        userRecentPackets,
        corruptWarn,
        trackNo,
        startTime,
        size,
        connection
    );
    bob = concord.getUserByTrackNo(1);
    sue = concord.getUserByTrackNo(2);
});

test('Nobody speak, nobody get choked', () => {
    const report = concord.getDisruptionReport();
    expect(report.disruption.length).toBe(0);
});

test('Mute/Unmute disruptive user', () => {
    concord.speaking(2, true); // Sue begins speaking...
    concord.speaking(1, true); // Bob interrupts!

    expect(concord.isMuted(bob.id)).toBe(true); // Bob is now muted
    expect(concord.isMuted(sue.id)).toBe(false); // Sue can continue
    expect(concord.getSpeakingByUserId(bob.id)).toBe(false); // Concord reports Bob is silent
    expect(concord.getSpeakingByUserId(sue.id)).toBe(true); // Concord reports Sue is still speaking

    concord.speaking(2, false); // Sue finishes speaking.
    expect(concord.getSpeakingByUserId(sue.id)).toBe(false); // Concord understands this.
    expect(concord.isMuted(bob.id)).toBe(false); // Bob has been unmuted.
});

