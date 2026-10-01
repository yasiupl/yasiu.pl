---
title: "Hello, can you hear me? The SDR on board OPS-SAT"
date: 2023-11-20T14:48:15+01:00
updated: 2026-10-01
ai: edited
image: ops-sat-sdr-waterfall.jpg
description: "A 30-second radio recording from OPS-SAT over Poland: the Software Defined Radio subsystem, an M17 signal from the ground, and the topic of my master's thesis."
---

Hello, can you hear me? 🎙️📻

In [my last post about OPS-SAT - The Flying Laboratory](/blog/my-ops-sat-adventures/), I have covered the visible spectrum and some of the amazing pictures I was able to capture from orbit. 📸

Moving closer to the end of my internship and having selected the concentration of my Master Thesis, I have focused on the Software Defined Radio subsystem.

Above you can see a waterfall image of a 30 second recording in the radio spectrum, centered around 433.90 MHz with 750 kHz bandwidth. It was captured while flying over Poland at an altitude of around 440 km.

Special feature of this recording is a signal sent in the direction of OPS-SAT by [Wojciech Kaczmarski SP5WWP](https://en.wikipedia.org/wiki/Wojciech_Kaczmarski), the developer of the M17 protocol 📟. We tried to decode the signal, but ultimately it turned out to be too weak. But fear not, it is not our last try!

On top of that you can see a plethora of other radio emissions in the Ham Radio and ISM bands. It shows the feasibility of the SDR subsystem, but also gives you insight into the Signal Intelligence (SIGINT) opportunities that can be explored.

In my coming work I'll work towards streamlining the operations of the SDR subsystem on OPS-SAT in order to allow more radio experiments to be run on board.

If you are interested in running your experiment (especially radio-related), reach out to us at the [OPS-SAT experimenter portal](https://opssat1.esoc.esa.int/)!

Thanks to the OPS-SAT team: David Evans, Tim Oerther, Vladimir Zelenevskiy, Marcin Kovalevskij, Adrián Calleja Vázquez, Georges Labrèche and Tom Mladenov.

## More

- [My master's thesis](/blog/masters-thesis-ops-sat/), "Software Defined Radio data processing on board OPS-SAT Space Laboratory", is the result of this work.
- [M17 Project](https://m17project.org/about/): an open-source digital radio protocol for voice and data, made by and for amateur radio operators. Wojciech Kaczmarski (SP5WWP) started the project in 2019 in Warsaw.
- [The 2021 ARRL Technical Innovation Award honors Wojciech Kaczmarski, SP5WWP](https://www.arrl.org/news/view/the-2021-arrl-technical-innovation-award-honors-wojciech-kaczmarski-sp5wwp) (ARRL).
- [OPS-SAT: your flying laboratory](https://www.esa.int/Enabling_Support/Operations/OPS-SAT_your_flying_laboratory) (ESA).
- [Mission complete for ESA's OPS-SAT flying laboratory](https://www.esa.int/Enabling_Support/Operations/Mission_complete_for_ESA_s_OPS-SAT_flying_laboratory) (ESA): OPS-SAT re-entered the atmosphere on 22-23 May 2024.

*This post first appeared [on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7132364022464589824/).*
