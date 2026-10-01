---
title: "Master's Thesis: SDR Data Processing on board OPS-SAT"
date: 2024-12-18T18:00:00+01:00
updated: 2026-10-01
ai: written
image: ops-sat-mission-control-team.jpg
description: "My master's thesis at Gdańsk Tech: Experiment 266, which records and processes radio signals on board the OPS-SAT satellite of ESA."
---

I defended my master's thesis at Gdańsk University of Technology. It closes my studies in Space and Satellite Technologies, with the specialization Engineering and Management of Space Systems. The supervisor was dr inż. Piotr Rajchowski. The title is *"Software Defined Radio Data Processing on board of OPS-SAT Space Laboratory"*, and the thesis is in English.

OPS-SAT was a 3-unit CubeSat of the European Space Agency (ESA). External teams could run their own software experiments on board. Since the launch in 2019, the OPS-SAT Space Laboratory supported more than 250 registered experiments. From August 2023, I worked for six months as a Mission Control Engineer in the OPS-SAT Mission Control Team at ESOC in Darmstadt. The header photo shows the team in the Main Control Room of ESOC.

After four years in orbit, the satellite operated in a degraded state. The reaction wheels could not point it accurately, and the orbit decayed. Many experiments that needed accurate pointing were no longer possible. The Software Defined Radio (SDR) did not have this problem, but the team used it only a little. Each SDR recording needed many manual steps from the operators.

For the thesis, I wrote Experiment 266 (EXP266). It makes the SDR easier to operate:

1. The operator sets the frequency, the bandwidth and the duration of a recording, and schedules it for a pass.
2. At the scheduled time, the experiment records the radio samples directly to the on-board memory.
3. The experiment makes a waterfall plot of the recording. The plot is small, so it goes to the ground quickly.
4. The operator finds the signals of interest on the plot.
5. The experiment extracts only these signals from the recording (downsampling). Only the small result goes to the ground.

The first live test was on 29 December 2023, during a demonstration at the 37th Chaos Communication Congress (37C3) in Hamburg. Our ground station was a Yaesu FT5DE handheld radio with a 10-element Yagi antenna. At 19:03:38 UTC, OPS-SAT started to record, and we transmitted a voice message with greetings and our amateur radio callsigns. The satellite was approximately 800 km away.

The recording was 33 seconds long. We first downloaded the waterfall plot, which confirmed that the recording was in the memory. Then we downloaded the full recording over three S-band passes. The voice was faint, but we could hear the message. A picture that we transmitted at the same time with Slow Scan Television (SSTV) did not decode. Later, the downsampling on the Engineering Model of OPS-SAT made the recording approximately 9 MB.

OPS-SAT re-entered the atmosphere on 22 May 2024. Because of this, the final version of the experiment did not run in space in full. The source code of EXP266 is open source: <https://github.com/yasiupl/opssat-sdr>.

![New Zealand, photographed from orbit by OPS-SAT](ops-sat-new-zealand-original.png)

*New Zealand. I took this photo with the camera of OPS-SAT. Image © ESA. [Full resolution, 2048 × 1944 px (PNG, 3.3 MB)](ops-sat-new-zealand-original.png).*

Read the full thesis: [Software Defined Radio Data Processing on board of OPS-SAT Space Laboratory](masters_thesis.pdf) (PDF, 6.8 MB).

More about the work on OPS-SAT: [My OPS-SAT Adventures](/blog/my-ops-sat-adventures/), [Hello, can you hear me?](/blog/ops-sat-sdr-hello-can-you-hear-me/) and [Talking to OPS-SAT from 37c3](/blog/ops-sat-at-37c3/).

**Update, January 2025:** I received my master's diploma. I completed the thesis with the grade "very good" (5.0). Gdańsk Tech also gave me the Golden Badge of the Graduate (Złota Odznaka Absolwenta) for my work during the studies. During the master's studies, I spent one semester at Hochschule Bremen in the double-degree programme Engineering and Management of Space Systems. In 2024, I was also the Deputy Chair for Finance of the Student Government of Gdańsk Tech. [Read the original post on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7284875592074690560/) (in Polish).

**Update, March 2025:** The thesis received the "Dyplom Roku" (Diploma of the Year) award of the Faculty of Mechanical Engineering and Ship Technology. This award is a distinction of the Rector of Gdańsk Tech for the authors of the best master's theses of 2024. I received it on 5 March 2025, during the ceremonial session of the University Senate. [Read the news from the faculty](https://wimio.pg.edu.pl/aktualnosci/2025-03/za-nami-uroczyste-posiedzenie-senatu-pg-z-okazji-promocji-akademickich) (in Polish). You can also read [the leaflet from my entry to the competition](masters_promo.pdf) (PDF, 6.9 MB, in Polish).
