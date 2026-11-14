---
title: "OPS-SAT SDR poster at IAC 2024 in Milan"
date: 2024-10-17T18:00:00+02:00
updated: 2026-11-14
ai: written
image: iac-2024-group-milan.webp
description: "At the 75th International Astronautical Congress in Milan, I presented a poster about Experiment 266: recording and processing radio signals on board the OPS-SAT satellite of ESA."
---

![Me with the poster at the interactive presentation screen no. 63](iac-2024-poster-booth.webp)

On 17 October 2024, I presented my poster *"Software Defined Radio Data Processing on board OPS-SAT Space Laboratory"* at the 75th International Astronautical Congress (IAC 2024) in Milan. It was in the Interactive Presentations of the IAF Space Operations Symposium (paper IAC-24,B6,IPB,15,x82617). The photo at the top shows me with people from the [SimLE Science Club](/blog/simle-science-club/) in front of the IAC 2024 sign.

The poster is about Experiment 266 (EXP266), the subject of my [master's thesis](/blog/masters-thesis-ops-sat/). OPS-SAT was a 3-unit CubeSat of ESA and a flying laboratory for new software and operations. After four years in orbit, the satellite was degraded: the eMMC memory had corrupted parts, and the processor could not handle radio data in real time. EXP266 works around this. It records the radio samples directly to a stable part of the eMMC, makes a small waterfall plot for the ground, and extracts only the signals of interest from the recording.

The poster also shows the result of our live test at the [37th Chaos Communication Congress](/blog/ops-sat-at-37c3/) on 29 December 2023. At 19:03:38 UTC, OPS-SAT started to record, and we transmitted a voice message with greetings and our callsigns. We downloaded the recording over three S-band passes. The voice was faint, but we could hear the message :)

![The IAC 2024 poster](iac-2024-poster.webp)

In Milan, there was already a stand that promoted IAC 2027 in Poznań. The next congress in Poland, I'm looking forward to it :D

![At the IAC 2027 Poznań stand in Milan](iac-2027-poznan-stand.webp)

The poster, the thesis and the code are open:

- Poster (PDF, CC BY 4.0): [doi.org/10.5281/zenodo.24230137](https://doi.org/10.5281/zenodo.24230137)
- Paper page in the IAF Digital Library: [IAC-24,B6,IPB,15,x82617](https://dl.iafastro.directory/event/IAC-2024/paper/82617/)
- Master's thesis: [doi.org/10.5281/zenodo.24229605](https://doi.org/10.5281/zenodo.24229605)
- Source code: [github.com/yasiupl/OPS-SAT-SDR](https://github.com/yasiupl/OPS-SAT-SDR)

Ad Astra!
