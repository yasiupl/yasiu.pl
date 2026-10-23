# yasiu.pl
[![Netlify Status](https://api.netlify.com/api/v1/badges/a61afadc-1722-478b-a901-301e1cbe0c12/deploy-status)](https://app.netlify.com/sites/yasiu/deploys)

Behind the scenes works of my personal website. Nothing fancy.

## Hosting

The site has two parts:

- The site: static files on Vercel. The site can also be on Netlify, without changes to the code. The site has no server functions.
- The backend: a Node.js server on blade12 at `api.yasiu.pl`. It runs the API routes, the WebFinger route and the dynamic part of the actor `@blog@yasiu.pl` (see "Fediverse"). See [`infra/README.md`](infra/README.md).

The tools make the two parts:

- [webpack](https://webpack.js.org/) makes the site (HTML, CSS, JavaScript, images, PDF files) in `public/`.
- [Nitro](https://nitro.build/) makes the two outputs from [`nitro.config.mjs`](nitro.config.mjs):
  - On Vercel and Netlify (the variable `VERCEL` or `NETLIFY` has a value), Nitro makes the static site with the redirects. The presets are `vercel-static` and `netlify-static`. On Vercel, the output is `.vercel/output/`. On Netlify, the output is `dist/`.
  - With `NITRO_PRESET=node-server`, Nitro makes the backend from the routes in `server/`. [`infra/api/Dockerfile`](infra/api/Dockerfile) uses this.

`npm run build` makes the CV, the site and the deployment. These are the build commands:

- Vercel: the `vercel-build` script of `package.json`. It downloads Tectonic for the CV, and then runs `npm run build`.
  If the project settings of Vercel have a "Build Command", that command replaces the script. Keep the field empty.
- Netlify: `make deploy` (see `netlify.toml`).

To add a redirect, add it to `routeRules` in the site part of `nitro.config.mjs`. Do not add redirects to `netlify.toml` or to a `vercel.json` file.

### API routes

The live cards of the home page get their data from the API routes in `server/api/`. The routes run on the backend at `https://api.yasiu.pl`:

- `/api/lastfm`: the last track on Last.fm ("I'm listening to...").
- `/api/location`: the area where I am ("Last seen..."). See "Location".
- `/api/views`: the number of views of each blog post, from Plausible (see "Post footer").
- `/api/comments?slug=<slug>`: the replies, likes and boosts of a blog post from the fediverse (see "Fediverse").

The site calls the backend at the address in `API_BASE` (see `webpack.config.js`). On Vercel and Netlify, the address is `https://api.yasiu.pl`. A local build uses the same origin.

The backend keeps each answer in memory: 60 seconds for `/api/lastfm` and `/api/comments`, 5 minutes for `/api/location` and 10 minutes for `/api/views`. If the source of an answer fails, the route sends the last good answer. The route rules in the backend part of `nitro.config.mjs` set the times and the CORS headers.

The API routes read these environment variables. For each variable, a route also reads the file in `<variable>_FILE`. On blade12, the secrets are files from sops (see [`infra/api/README.md`](infra/api/README.md)).

| Variable | Value |
| --- | --- |
| `LASTFM_API_KEY` | The API key of Last.fm. |
| `OWNTRACKS_USER`, `OWNTRACKS_PASSWORD` | Optional: the login and the password for `/api/0/last` of the OwnTracks Recorder (HTTP basic authentication). The backend on blade12 needs no login. |
| `OWNTRACKS_RECORDER_USER`, `OWNTRACKS_RECORDER_DEVICE` | Optional: the user and the device in the Recorder. The defaults are `yasiu` and `spacewar`. |
| `OWNTRACKS_URL` | Optional: the address of the Recorder. The default is `https://owntracks.yasiu.pl`. On blade12, the address is `http://owntracks-recorder:8083`. |
| `PLAUSIBLE_API_KEY` | The Stats API key of Plausible, for `/api/views`. Make it in Plausible: "Settings", "API Keys", type "Stats API". |
| `PLAUSIBLE_URL` | Optional: the address of Plausible. The default is `https://plausible.yasiu.pl`. On blade12, the address is `http://plausible:8000`. |
| `BLOG_PRIVATE_KEY` | The private key (PEM) of the actor `@blog@yasiu.pl`. See "Fediverse". |
| `DATA_DIR` | Optional: the folder of the database of the actor `@blog@yasiu.pl`. The default is `./.data`. On blade12, the folder is the volume `/data`. |
| `BLOG_OUTBOX_URL` | Optional: the outbox that the task `blog:sync` reads. The default is the outbox of the site. Use it to test with a local build. |
| `MAPBOX_TOKEN` | The access token of Mapbox, for the map image. The token has URL restrictions, so the route sends the header `Referer: https://yasiu.pl/`. Without this header, Mapbox sends 403. |

The routes also accept the names of the old Netlify functions: `lastfm`, `owntracks_user`, `owntracks_device` and `mapbox_token`.

To run the API routes on your computer, run `npm run dev:api` (port 3000) next to `npm start`. The development server of webpack sends `/api/` to port 3000.

### Location

The "Last seen..." card shows an area, not the GPS position. The response of `/api/location` does not contain the GPS position.

- In a city or a town, the card shows the district and the city, for example "Wrzeszcz Górny, Gdańsk". A town without districts shows only its name, for example "Iława".
- In the country, the card shows a geographical region from OpenStreetMap. The order is: a historical region (for example "Kaszuby"), a physiographic region (for example "Pojezierze Iławskie"), the municipality.
- At 15 km/h or more, the card shows "En route" and the speed. The map then shows the province.

The map image fits the area, not the position. [`server/utils/region.js`](server/utils/region.js) selects the area.
The route gets the data from these services:

- The OwnTracks Recorder: the last position.
- [Nominatim](https://nominatim.org/) and the [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API): the areas around the position. These free services of OpenStreetMap permit only few requests. The backend keeps the area of each spot (about 100 m) for one week. Thus these services get a request only when the position goes to a new spot.
- The Mapbox Static Images API: the map image.

If an Overpass server does not answer, the route tries again: `overpass-api.de` two times, then the next server. If no server answers, the route sends an error with the cause, for example `{"overpass": ["overpass-api.de: HTTP 504", …]}`. The backend then continues to send the last good response.

## Projects

The project cards are generated at build time from [`src/projects.md`](src/projects.md).
To add, remove or reorder a project, edit that file. The format is described at its top.

## Profile card

The card at the top of the home page is like a business card. [`build/profile.js`](build/profile.js) makes it from the same data as the CV:

- the name, the tagline, the summary (`summary-en`), the photos and the contact data come from the `header` part of [`src/cv.md`](src/cv.md),
- the current job is the first `work` entry in `src/timeline.md` with the end `now`.

The card is also the representative h-card of the site.

### Keys and identities

The last line of the card shows the public keys. The fields `pgp` (the fingerprint), `keybase` and `email` of `src/cv.md` set it.

- `/pgp.pub` and `/ssh.pub` send to the keys on Keybase and GitHub (`routeRules` in `nitro.config.mjs`).
- Web Key Directory (WKD): `gpg --locate-keys contact@yasiu.pl` gets the key from `/.well-known/openpgpkey/hu/`. The build downloads the key from Keybase (or from GitHub), and stops if its fingerprint is not `pgp`. See [`build/keys.js`](build/keys.js). After you change the key on Keybase, deploy the site again.
  The DNS of `yasiu.pl` has a wildcard record, so `openpgpkey.yasiu.pl` must have a TXT record and no A record. Without it, GnuPG uses the "advanced method" on that host and fails.
- Keyoxide (`/keyoxide`) reads the key from the WKD and shows the identity proofs in it.
- Bluesky: the handle `@yasiu.pl` is in `src/static/.well-known/atproto-did` and in the TXT record `_atproto.yasiu.pl`.

## Timeline

The build makes the "Timeline" section of the home page from [`src/timeline.md`](src/timeline.md) and from all blog posts.
To add work, education, a project, a talk, an award or a certificate, edit `src/timeline.md`. The format is described at its top.
Do not add blog posts to `src/timeline.md`. The build adds them.

## CV

The build makes the CV from the data of the site. The CV has one page in English and one page in Polish.

- [`src/timeline.md`](src/timeline.md) gives the dates, the organizations and the places.
- [`src/cv.md`](src/cv.md) selects the timeline entries for the CV and adds the descriptions, the skills and the contact data. The format is described at its top.
- [`build/cv.js`](build/cv.js) makes a LaTeX file from the two files. Then [Tectonic](https://tectonic-typesetting.github.io/) makes the PDF from the LaTeX file.

The PDF is [`src/static/cv/Marcin_Jasiukowicz_CV.pdf`](src/static/cv/Marcin_Jasiukowicz_CV.pdf). The site publishes it at `/cv/Marcin_Jasiukowicz_CV.pdf`.
The short address `/cv` redirects to the PDF (see `nitro.config.mjs`).

To change the CV, edit `src/timeline.md` or `src/cv.md`. Do not edit the PDF.
`npm run build` makes the CV before the site. To make only the CV, run this command:

```bash
npm run cv
```

You must have Tectonic on your computer to make the PDF. If Tectonic is not found, the command writes only the LaTeX file (in `build/cv-out/`) and the site keeps the PDF from the repository.
On Vercel and on Netlify, the build command downloads Tectonic before the build (see "Hosting").
Commit the new PDF after you change the CV data. Then the PDF in the repository agrees with the site, also when the download of Tectonic fails.

Keep the CV on two pages. After you add text, look at the PDF. If a page overflows, the PDF has three pages.

### Public and private CV

The build makes two versions of the CV:

- The public CV, `/cv/Marcin_Jasiukowicz_CV.pdf`, has no phone number. The site links to it. It is in the repository.
- The private CV has the phone number. The site does not link to it. It is not in the repository, because the repository is public.

The build makes the private CV only when the variable `CV_PHONE` has a value. These variables set the private CV:

- `CV_PHONE`: the phone number, for example `+48 123 456 789`.
- `CV_PRIVATE_NAME`: the file name of the private CV, for example `Resume_<something>.pdf`. The address is `/cv/<file name>`. If you do not set it, the build makes the name from the phone number.

On your computer, write the variables in the file `.env` in the root of the repository. Git ignores this file.
On the platform, set the variables in the settings of the project (see "API routes"). Then deploy the site again.

Give the address of the private CV only to the persons who must have it.
Keep the file name of the private CV with the prefix `Resume_`. For these files, `robots.txt` tells search engines (see "Search engines") not to read the file.

### Business card

The same build makes a business card from the data of the CV, in two versions:

- The public card, `/cv/Marcin_Jasiukowicz_card.pdf`, has no phone number. The QR code on the back opens the website.
- The private card has the phone number. The QR code on the back adds the contact (name, phone, email and website) to a phone.
  `CARD_PRIVATE_NAME` sets its file name. Keep the prefix `Card_`. If you do not set it, the build makes the name from the phone number.

The card is 85 mm × 55 mm. The PDF has 3 mm of bleed on each side, and a trim box for the print shop. Page 1 is the front and page 2 is the back.
The front shows the background photo, the profile photo, the name, the tagline and the current job. The current job is the first `work` entry in `src/timeline.md` with the end `now`.
The back shows the contact data and the QR code.
The background of the card is `src/cv/earth-card.jpg`, a part of the same OPS-SAT photo as the CV header.

### Emoji

The fonts of the CV and of the card have no emoji. The build shows each emoji as an image from `src/cv/emoji/`.
The images are from [Noto Emoji](https://github.com/googlefonts/noto-emoji) (Apache License 2.0). The file name is `emoji_u<code point>.png`, for example `emoji_u1f680.png` for 🚀.
If you use a new emoji in `src/cv.md`, add its image from `2D/png/512/` of Noto Emoji. Otherwise, the build stops with an error.

The service worker does not precache PDF files.

## Blog

The build makes the blog pages from the Markdown files in [`blog/`](blog).
Each file is one post. The build makes these pages:

- `/blog/`: the list of all posts, newest first.
- `/blog/<slug>/`: one page for each post.
- `/blog/feed.xml`: an Atom feed with all posts.

The home page shows the three newest posts.

To add a post, add a file with the name `YYYY-MM-DD-slug.md`.
Use only lower-case letters, digits, and dashes in the slug. The slug is the last part of the post URL.
Start the file with this front matter:

```markdown
---
title: "The title of the post"
date: 2026-09-30T12:00:00+02:00
lang: pl
description: "One or two sentences for the post list and for link previews."
image: header.jpg
---
```

- `title` (required): the post title.
- `date`: the publication date. If you do not set it, the build uses the date from the file name.
- `lang`: the language code of the post. The default is `en`.
- `description`: the summary on the post card. If you do not set it, the build uses the start of the post text.
- `image`: the header image of the post. Use a full URL or the name of a file in the post folder.
  If you do not set it, the build uses the first image of the post.
  If the post text shows the header image as a separate paragraph, the build removes it from the text.
  If a post has no image, it has no header image.
- `crop`: the part of the header image that the 16:9 crop keeps: `top`, `center` or `bottom`. The default is `center`.
  Use `top` for a portrait photo with faces near the top.
- `updated`: the date of the last edit, as `YYYY-MM-DD`. Set it when you change the text of a post after its publication.
  The post page shows it in grey under the post, above the links to the older and newer post, if the date is not the day of publication. The Atom feed uses it in `<updated>`.
  With this date, a reader can see the difference between a historical post and a post that was written or changed later.
- `index`: `yes` lets search engines index the post page and its files (see "Search engines"). The default is `no`.
- `video`: the YouTube URL of the main video of the post, for example `https://youtu.be/MfWttCMSoNI?t=257`. A start time (`t=` or `start=`, in seconds or as `4m17s`) is optional.
  The post page shows the player in place of the header image. The header image stays on the post card and in the link previews, and the post card shows a play button.
  If the header image is a YouTube thumbnail `youtube-<ID>.jpg`, the post gets the player of that video without this field.
  If the post text has a player of the same video as a separate block, the build removes it from the text. Do not set the field for a short clip next to the text.
- `ai`: how much of the post an AI wrote.
  - `written`: an AI wrote the post from the materials of the author (for example notes, transcripts, forum threads). The author checked it.
    The post page shows a note in grey under the post, next to the date of the last edit.
  - `edited`: the author wrote the post. An AI edited it or added parts (for example the "More" section with sources).
    The post page does not show a note. The field only records the fact in the source file.
  - Do not set the field for a post that the author wrote without an AI.

### Post footer

Above the post text, the page shows the author card: the photo, the name, the tagline (in the language of the post) and the current job, with a link to the home page. It is for readers who come to a post from a link. The data comes from `src/cv.md` and `src/timeline.md`, like the profile card (`authorData` in `build/profile.js`).

Under each post, the page shows a footer (`renderFooter` in `build/blog.js`):

- The number of views. The element `.post-views` has the path of the post in `data-views-path` and stays hidden until a script writes the number into `.post-views-count`.
  `src/app.js` gets the numbers from the backend (`/api/views`, see "API routes"). Without an answer, or with 0 views, the number stays hidden.
- Comments: the replies, likes and boosts from the fediverse (see "Fediverse"). The element `.post-comments` has the slug of the post in `data-comments-slug`. `src/app.js` writes the data from `/api/comments` into it. If the post has no replies, the card shows "be the first". The card always shows the steps to comment from a fediverse app, with a button that copies the address of the post, and a link for email (the subject is the post title).
  Without the public key of the actor (see "The key of the actor"), the card shows only the link for email.
- Support: a link to Patreon.

The texts of the footer are in English and in Polish (`WORDS` in `build/blog.js`). The footer is not in the Atom feed.

### Post files

To add files to a post (for example, PDF files or images), put them in the post folder.
The post folder has the same name as the post file, without `.md`.
For example, the files of `2024-12-18-masters-thesis-ops-sat.md` are in `2024-12-18-masters-thesis-ops-sat/`.
The build copies the post folder to `/blog/<slug>/`.

In the post, refer to a file with its name only, for example `[The thesis](masters_thesis.pdf)`.
The build stops with an error if the file is not in the post folder.

### Images

Keep the original images in the post folder. Do not make smaller copies.
The build reads the width and the height of each image and writes them into the page.

On Vercel and on Netlify, the image CDN of the platform makes smaller copies of the images when a browser asks for them.
The [unpic](https://unpic.pics/lib/) library makes the CDN URLs. The image widths are in `IMAGE_WIDTHS` of `build/blog.js`. Vercel accepts only these widths (see `nitro.config.mjs`).

- An image in the post text is 800 px or 1600 px wide. It links to the original file.
- The header image is 800 px or 1600 px wide. It links to the original file.
- The image on the post card is 480 px or 960 px wide.
- The post card shows a play button if the post has a header video (see `video`). Use the name `youtube-<ID>.jpg` for the thumbnail of a post about a video.

The CSS crops the header image and the card image to the proportions 16:9 (see `crop`).
The browser selects the width that agrees with the screen. The build does not ask for a width that is larger than the original. If the original is narrower than all widths, the page shows the original.
The CDN sends WebP or AVIF to browsers that accept these formats.
An image that is already in a link keeps that link.

The documentation of the CDNs does not tell if the CDN uses the EXIF orientation of an image.
Thus, the build does not send an image with an EXIF rotation to the CDN. The page shows the original file.

Local builds (`npm start` and `npm run build`) use the original images.

Keep all files of a post in the post folder. Do not link images or documents from other sites.
If you must use an image from another host, add the host to the image settings of the platform (on Vercel: `remotePatterns` in `vercel.config.images` of `nitro.config.mjs`).
Without this setting, the image CDN does not accept the image.

The service worker does not precache the files in `/blog/`, because they are too large.

The build stops with an error if a post has a wrong file name, an unknown field, or no title.
If you add or rename a post while `npm start` runs, restart `npm start`.

### Search engines

Search engines show the blog, but not the details of the posts:

- They index `/blog/` and the home page. These pages show the title, the date and the summary of each post.
- They do not index the post pages. Each post page has the tag `<meta name="robots" content="noindex, follow, noimageindex">`.
  The search engines follow the links on the page, but they do not show the page in the results.
- They do not read the files of the posts (images, PDF files, archives). `robots.txt` closes the post folders to crawlers, but not the post page itself: a crawler must read the page to see its `noindex` tag.
- Google Images gets no images of the posts and no images from the image CDN (`/_vercel/image`, `/.netlify/images`). The cards on `/blog/` use the CDN, thus Google Images does not show them.

To show a post in search engines, set `index: yes` in its front matter. The post page then has no `robots` tag, its folder is open to crawlers, and the post is in `sitemap.xml`. Google Images can then index the original images of the post, but not the CDN copies.

The build makes `robots.txt` and `sitemap.xml` from the posts (`renderRobots` and `renderSitemap` in `build/blog.js`). Do not add a `robots.txt` file to `src/static/`.
The links in social media and in Mastodon still show a preview of a post: the `noindex` tag does not stop the previews.

The home page has the profile data in JSON-LD (schema.org `Person`) from the `header` part of `src/cv.md`. Google can use it for the knowledge panel.

`robots.txt` does not remove the pages and files that Google already has in its index. To remove them faster, use "Removals" in Google Search Console.
Submit `https://yasiu.pl/sitemap.xml` in Google Search Console once.

## Analytics

The site uses Plausible Analytics on the self-hosted server `plausible.yasiu.pl`.
The script is in the `<head>` of `src/index.html` and `src/blog.html`. All pages use one of these two templates.
The site name in Plausible is `yasiu.pl` (the `data-domain` attribute of the script).
The script also counts file downloads (for example, the CV and the thesis PDF files) and clicks on links to other sites.

To see the statistics, log in to `plausible.yasiu.pl`.
If the site `yasiu.pl` is not in Plausible, add it there before you deploy. Plausible does not record visits for an unknown site.

## Fediverse

The site has two fediverse handles:

- `@blog@yasiu.pl`: the actor of the blog. It publishes each post as an ActivityPub `Article`. The replies, likes and boosts of a post show under the post.
- `@yasiu@yasiu.pl`: an alias of the Mastodon account `@yasiu@0x3c.pl`.

The site redirects `/.well-known/webfinger` to the backend (`nitro.config.mjs`).
On the backend, [`server/routes/.well-known/webfinger.get.js`](server/routes/.well-known/webfinger.get.js) answers for both handles:

- For `acct:blog@yasiu.pl`, the answer has the actor of the blog.
- For `acct:yasiu@yasiu.pl`, the answer has the subject `acct:yasiu@0x3c.pl`. The other server then finds the account on `0x3c.pl` and shows it as `@yasiu@0x3c.pl`.

### The actor of the blog

The actor has a static part on the site and a dynamic part on the backend.
If the backend stops, the fediverse can still read the actor and all posts. Other servers send their activities again later.

The addresses are in [`server/utils/blog-actor.json`](server/utils/blog-actor.json). The build and the backend read this file.

| Part | Address | Source |
| --- | --- | --- |
| Actor | `https://yasiu.pl/ap/blog.json` | [`build/activitypub.js`](build/activitypub.js) (static) |
| Outbox: all posts | `https://yasiu.pl/ap/blog/outbox.json` | `build/activitypub.js` (static) |
| One object for each post | `https://yasiu.pl/ap/blog/posts/<slug>.json` | `build/activitypub.js` (static) |
| Inbox | `https://api.yasiu.pl/ap/blog/inbox` | [`server/routes/ap/blog/inbox.post.js`](server/routes/ap/blog/inbox.post.js) |
| Followers: the number only | `https://api.yasiu.pl/ap/blog/followers` | `server/routes/ap/blog/followers.get.js` |

The page of each post has the tag `<link rel="alternate" type="application/activity+json">` with the address of its object.
Thus, a search for the address of the page in a fediverse app finds the post. A reader can then reply, like or boost.
The site sends the files in `/ap/` with the content type `application/activity+json` (see the route rules in `nitro.config.mjs`).

The inbox accepts only requests with a valid HTTP signature of the actor of the activity. It keeps:

- The followers. The inbox answers each `Follow` with an `Accept` at once.
- The public replies to a post, and the public replies in the thread of a post. The backend removes all HTML except the elements of a short text post ([`server/utils/ap-sanitize.js`](server/utils/ap-sanitize.js)). Replies only for followers or mentioned people are not kept.
- The likes and the boosts of a post.
- The changes (`Update`), the deletions (`Delete`) and the cancellations (`Undo`) of these items.

The backend keeps the data in one SQLite file in `DATA_DIR` ([`server/utils/ap-db.js`](server/utils/ap-db.js)).
The backend sends requests only to public HTTPS servers ([`server/utils/ap-http.js`](server/utils/ap-http.js)).

Two tasks run on the backend (the scheduled tasks in `nitro.config.mjs`):

- `blog:sync`, every five minutes: reads the outbox of the site. For a new post, it sends `Create` to the followers. For a post with a new `updated` date, it sends `Update`. For a removed post, it sends `Delete`. The first run only records the posts: the archive does not go to the followers.
- `blog:deliver`, each minute: sends the delivery queue. If a delivery fails, the next attempt is later each time, up to 6 hours. After about three days, the backend stops.

Thus, a new post reaches the followers some minutes after the deployment of the site.
To send a changed post again, set `updated` in its front matter.

### The key of the actor

The actor signs its requests with an RSA key.
The public key is in `src/activitypub/blog.pub.pem`. The private key is a secret of the backend (`BLOG_PRIVATE_KEY`).
Without the public key, the build makes no files in `/ap/`, and the post pages have no link to an object.

To make the key, do these commands on a device that you trust:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out blog.key
openssl pkey -in blog.key -pubout -out src/activitypub/blog.pub.pem
```

Add the content of `blog.key` to the secrets of the backend (see [`infra/api/README.md`](infra/api/README.md)), and then delete `blog.key`.
Do not change the key after the first deployment: other servers keep the public key of the actor.

### Webmentions and link previews

The site receives webmentions at webmention.io (see the `rel="webmention"` links in `src/index.html` and `src/blog.html`).

The blog pages also have the tag `<meta name="fediverse:creator" content="@yasiu@0x3c.pl">`.
With this tag, Mastodon shows `@yasiu@0x3c.pl` as the author on link previews of the blog.
To use this function, add `yasiu.pl` to the allowed websites for author attribution in the settings of the `@yasiu@0x3c.pl` account.
