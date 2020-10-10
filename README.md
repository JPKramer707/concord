# Concord
Concord is a real-time voice chat moderation bot for [Discord](http://discord.com).
## Purpose
Rewarding good-faith voice chat communication and protecting the conversational liberty of good-faith communicators by practical, metric-based policing of public voice traffic data.

Concord intervenes in real-time voice chat sessions, according to configured policy, to influence the flow of conversation and to emotionally protect conversants from disruption and bullying.

Concord is designed for use in public voice chats populated by strangers.
## Metrics
### Conversational heatmap
Shows the pace of the conversation over time, from start to present. 
### “Ear rape” detection
Ear rape is the deliberate introduction of audio, which has been amplified to the point of distortion, into a voice chat, as a means of harassment and annoyance to others.

“Ear rape,” as an interpersonal communication phenomenon, is fairly new according to Google search trends.
![Google search statistics for "Ear rape"](https://user-images.githubusercontent.com/13473249/95647584-5650dc00-0a85-11eb-915b-c77d5e47aa10.png)
There is a [Discord bot](https://botsfordiscord.com/bot/460550695037173770) designed to provide ear-rape on command.

The calling card of “ear rape” is audio signal clipping.
![Clipping Diagram](https://user-images.githubusercontent.com/13473249/95647593-636dcb00-0a85-11eb-91d3-5fc67caca98c.png)
When clipping occurs, instead of a smooth sine wave being produced as with normal audio, a squared-off and "clipped" waveform is produced resulting in sound distortion. Ear rape is literally impossible to accomplish without producing this telltale sign. Fortunately, this is very easy for a machine to detect.

By detection of this signal distortion, in combination with long-term behavior statistics, a reliable metric for “ear rape” is feasible, and intervention can be performed instantaneously.
### Crosstalk & interruption
If a user contributes noise during another user’s transmission, this is crosstalk.
![Crosstalk Diagram](https://user-images.githubusercontent.com/13473249/95647606-7e403f80-0a85-11eb-869b-b56f18f12c51.png)
Not all crosstalk is interruption.

Crosstalk can take many forms.

For example, if a user’s cat meows while another user is talking, this does not qualify as interruption. However, attempting to discriminate this from a conversational interruption could easily take our development efforts out to the cutting edge of AI noise/speech analysis technologies - which is not a frontier I am eager to explore at this time. Therefore, I intend to make this discrimination by utilizing long-term behavioral data instead.

Repeated crosstalk, in any form, establishes a pattern of disruptive and undesirable audio which can annoy and alienate conversants, even in the complete absence of malicious intention.

Ultimately, if a cat keeps meowing into the mic during another user’s speech, this does constitute a form of disruption, and while there is no malice on the part of the cat’s master, there is still negligence on the part of the user.
### Bullying
By correlating multiple instances of crosstalk, interruption, and “ear rape” with the perceived perpetrator and victim over time, we can meaningfully identify bullies and the targets of their bullying behavior.

In response to these insights, the policy module can apply stricter and/or harsher penalties to the bully when it is apparent he is perpetuating one of his undesired behavioral patterns.
### Cumulative talk time
We can measure how much each user speaks as a fraction of overall speech.
### Conclusion
These are merely metrics. In and of themselves, they do not influence conversation in any way. In order to influence conversation, real-time interventions must be applied.

Which interventions should be applied? How and when should they be applied? Which metric values and behavioral patterns should they be applied to? These questions are answered according to POLICY.
## Reporting
## Policy
Policy is the coupling point between METRICS, REPUTATION, and INTERVENTIONS, the hot spot for administrator configuration.

A policy configuration is essentially a code module, with the following inputs and outputs:
### Inputs
1. Historic and real-time voice metrics
1. User reputations
1. Policy history
  1. Warnings and interventions recently applied to this user
### Outputs
1. Intervention instructions
1. Reputation mutations
The administrator can correlate patterns from metrics and reputations with interventions and mutations to reputation.

The administrator can implement compassionate yet firm buffers between metrics and interventions, including audible and/or textual warning signals to potential offenders.
## Intervention
Intervention provides a means to influence the ongoing conversation as the administrator sees fit.

Influence on an ongoing conversation can take the form of brute force, or shame/humiliation.

Discord API provides a full suite of tools for administrators to utilize brute force, yet very little in terms of shame/humiliation.
### Warn
A warning issued to the offending user.
1. Verbal, issued within the voice channel
1. Text, issued via DM
1. Nickname. An emoji could be added to the offending user’s nickname.
### Pitch shift
Theoretical - not possible given the current state of the Discord API. The users’ voice can be digitally filtered in realtime, to shift the pitch higher or lower, with comical effect. This reduces the emotional threat to the other users, and offers slight humiliation to the bullying user.
### Volume attenuation
Theoretical - not possible given the current state of the Discord API. The users’s voice can be quieted gradually, creating distance between the offender and the offended. This can provide enough emotional safety as to negate the bullying effects.
### Mute
Silencing the offender entirely.
### Move
Moving the offender to a separate voice channel.
### Disconnect
Disconnecting the offender from the voice channel.
### Kick
Kicking the offender from the server.
### Ban
Banning the offender from the server.
### Reputation
Reputation is the long-term accumulation of metrics associated with a particular user. These are useful in mitigating false-positive identification of bad-faith communication.
