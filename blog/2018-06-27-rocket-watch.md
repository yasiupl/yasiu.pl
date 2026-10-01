---
title: "Rocket Watch is not over, and it's better than ever"
date: 2018-06-27T18:12:29+02:00
updated: 2026-10-01
ai: edited
image: imgur-qJ6fE74.png
description: "The comeback of Rocket Watch on r/spacex in 2018, the story of the project from spacex.yasiu.pl in 2016 to rocket.watch, and a summary of what the community said."
---

At this point it's probably a stale story, but still very important to me. If you are a longtime r/spacex subscriber you might remember my humble beginnings back in 2016, when I built a simple html file that consisted of a few frames containing launch webcast, reddit comment section and audio sources that helped you track the event of a launch without need to juggle between tabs and windows.

![SpaceX Watch in 2016: the CRS-8 webcast, camera views and the Reddit live thread on one page](imgur-iBOrJZl.png)

It was all fun and I got a ton of feedback that fuelled me to do more and continue with the project. I applied the same concept to recovery threads by embedding public camera views into the site. Sadly that didn't go without hiccups. You might remember the [PTZtv "disaster"](http://archive.is/raPSk) caused by my negligence of copyright law...

> ["Let me clear up the rumor and set the record straight. Rocket Watch is over."](http://archive.is/raPSk)

I got threatened with lawsuits by the owners of the camera (they claimed to know my identity back then, but they never actually reached out). Even then, I got a ton of support from you guys and a vote of confidence that I bear to this day. It sparked a time of change that made me rethink the concept of the project, and mobilized others to fill in the place of the missing camera, by going out and taking picture themselves, even talking about building our own crowdsourced camera (It never came to fruition, but it was a fun little experiment :D). After that I have kinda flown under the radar wanting to build something better. Since then, it has been my hobby to build this website from scratch, even though I had no prior education in web development. It's still by no means perfect, but I feel like it's finally ready to present to you guys!

I expanded the project to include the entirety of spaceflight, not only SpaceX. Now you can get to know any agency in the world thanks to the rich database of launches, spanning out from the inception of rocketry to the latest news, rumors and updates.

The list of features consists of, but is not limited to:

- Launch notifications before every launch with available live webcast;
- Notifications about popular posts and articles in spaceflight communities;
- Yearly stats and performance records for all agencies featured in the database;
- News feeds for reddit, facebook, twitter and youtube official news channels when available;
- Site works great on all screen sizes. You can pin it to your desktop on Chrome (Desktop and Android) and iPhone / iMac and use just like a native app;
- Dark mode for all you night owls out there!
- Curated collections of launches: CRS missions, Apollo missions and more...

![Pinning rocket.watch to the desktop in Chrome](imgur-o2JqTm9.png)

![Yearly launch statistics of SpaceX on rocket.watch](imgur-L7mshNT.png)

Visit it under a very memorable url of rocket.watch!

Also, check out some of other cool projects that support Rocket Watch: the Rocket Launch Schedule Google Chrome addon made by mrfhitz, the [Go4Liftoff](https://go4liftoff.com/) website and Discord bot made by scorp1579, and the OKTO Discord Bot by CallidusUmbra.

If you have any feedback you can join our [Discord server](https://discordapp.com/invite/5b8Xhny) or simply leave it in a comment down below. If you like the project, consider supporting me on [Patreon](https://www.patreon.com/yasiu). Follow us on social media at [@rocket_watch](https://twitter.com/rocket_watch), [@yasiupl](https://twitter.com/yasiupl) and r/RocketWatch. You can also review us on [Product Hunt](https://www.producthunt.com/posts/rocket-watch)!

At the same time I would love to express thanks to the people I've met along the way:

- EchoLogic - rip his account, but he will always live in my heart <3
- TheVehicleDestroyer for his amazing [FlightClub](https://flightclub.io) website and API that helped me start the journey.
- The rest of the awesome r/spacex mod team! You guys rock!
- Librarians and devs of the awesome Launch Library without whom this project wouldn't be possible!
- The [r/SpaceX GitHub](https://github.com/r-spacex) and Slack group. Particularly richiksc for designing the current r.w look!
- scorp1579 - maker of the Go4Liftoff website and Discord bot, and great help in answering my dumb questions :P
- Bug catchers and all those who gave insightful feedback into how make this project even better: roflllobster, Phenom10x, fourmica, MagnaArtium, Nenjo, Fredozorus, halcyoncmdr and more...
- Patrons who decided to monetarily support this project! ikerneii, Yogu & CAM-Gerlach
- Many more whose names I don't remember!

Most importantly, special thanks to all the members of r/SpaceX - the N°1 community on the internet. You guys are absolutely the best!

## The story of Rocket Watch

*I added this section and the next one in 2026, from my tweets of that time, the Reddit thread and the project repositories.*

- **2015:** I wrote about the first landing of a Falcon 9 first stage on my old blog, and cut [a compilation of the SpaceX webcast](https://www.youtube.com/watch?v=W2e-31laeuQ). I made more of those in 2016, for example [ORBCOMM-2 in under a minute](https://www.youtube.com/watch?v=FMFZN3FyNlk) and the [first landing on a droneship](https://www.youtube.com/watch?v=OE84bOilxhk).
- **Spring 2016:** the first version, `spacex.yasiu.pl`: one page with the webcast, the Reddit live thread and audio. For #bargewatch, I added the AIS position of the droneship, marine radio and the public camera of Port Canaveral, so you could see the booster come back to port. In May 2016, I said hello to 25 users of the site from Hawthorne, California - the headquarters of SpaceX.
- **May 2016: "Rocket Watch is over".** For the JCSAT-14 recovery, the site embedded the Port Canaveral webcam of PTZtv. The CEO of PTZtv called this "hacking", wrote in the SpaceX Facebook group that "Rocket Watch is over", had the host take the site down, and threatened legal action. On 12 May 2016, EchoLogic, a moderator of r/spacex, summarised the dispute in the post ["Regarding PTZtv, and links to their Port Canaveral Webcam"](ptztv-2016/index.html) (a copy is at the end of this post). The subreddit removed all links to the webcam, and the community started to plan its own camera. PTZtv called our death, but we persevered: two weeks later, Rocket Watch was live again for the Thaicom 8 launch - without the camera.
- **Summer and autumn 2016:** `ula.yasiu.pl` for the launches of United Launch Alliance, `data.yasiu.pl` with a repository of SpaceX documents, and even `apple.yasiu.pl` for the iPhone 7 event.
- **January 2017:** a new version, written from scratch, at `rocketwatch.yasiu.pl`, with launches of all agencies from the Launch Library. In November 2017, it went to Product Hunt.
- **2018:** the domain `rocket.watch`, an Android app, a Discord server, and this post. In April 2018, the Hungarian news site HVG [recommended Rocket Watch](http://hvg.hu/tudomany/20180402_raketafelloves_mikor_melyik_nap_rocket_watch) to its readers as the place to check when the next rocket launches.
- **2019:** the source code moved to [GitHub](https://github.com/yasiupl/rocket.watch), with a separate API. After I started university, I slowly stopped maintaining the project: my time went to the [Stardust balloon team](/blog/simle-science-club/), and the last big changes are from 2019.
- **March 2022:** I was busy with my [engineering thesis](/blog/engineering-thesis-stardust/) and forgot to renew the domain. That was the end of Rocket Watch. The `rocket.watch` domain now belongs to someone else, so the links to it in the original post are removed.

## The PTZtv post from 2016

On 12 May 2016, EchoLogic, a moderator of r/spacex, wrote "Regarding PTZtv, and links to their Port Canaveral Webcam". The post quotes the statement of PTZtv about Rocket Watch, which sparked controversy in the community. I keep a copy of the archived page here, in case archive.today goes away:

![The archived Reddit post "Regarding PTZtv, and links to their Port Canaveral Webcam" from 12 May 2016](ptztv-2016-screenshot.png)

- [The archived page](ptztv-2016/index.html) (HTML, with the comments).
- [The full archive](ptztv-2016.zip) (ZIP, 0.7 MB), as downloaded from archive.today.
- [The original capture on archive.today](https://archive.is/raPSk), from 12 May 2016.

## More

- [rocket.watch on GitHub](https://github.com/yasiupl/rocket.watch).
- [The original post on Reddit](https://www.reddit.com/r/spacex/comments/8uaw5m/rocket_watch_is_not_over_and_its_better_than_ever/).
- [Rocket Watch on Product Hunt](https://www.producthunt.com/posts/rocket-watch).
- [The Launch Library](https://thespacedevs.com/llapi), now maintained by The Space Devs.

*This post first appeared [on r/spacex](https://www.reddit.com/r/spacex/comments/8uaw5m/rocket_watch_is_not_over_and_its_better_than_ever/).*
