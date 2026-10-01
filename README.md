# yasiu.pl
[![Netlify Status](https://api.netlify.com/api/v1/badges/a61afadc-1722-478b-a901-301e1cbe0c12/deploy-status)](https://app.netlify.com/sites/yasiu/deploys)

Behind the scenes works of my personal website. Nothing fancy.

## Projects

The project cards are generated at build time from [`src/projects.md`](src/projects.md).
To add, remove or reorder a project, edit that file. The format is described at its top.

## Profile card

The card at the top of the home page is like a business card. [`build/profile.js`](build/profile.js) makes it from the same data as the CV:

- the name, the tagline, the summary (`summary-en`), the photos and the contact data come from the `header` part of [`src/cv.md`](src/cv.md),
- the current job is the first `work` entry in `src/timeline.md` with the end `now`.

The card is also the representative h-card of the site. Bridgy Fed uses the summary as the fediverse profile text (see "Fediverse").

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
On Netlify, the short address `/cv` redirects to the PDF (see `netlify.toml`).

To change the CV, edit `src/timeline.md` or `src/cv.md`. Do not edit the PDF.
`npm run build` makes the CV before the site. To make only the CV, run this command:

```bash
npm run cv
```

You must have Tectonic on your computer to make the PDF. If Tectonic is not found, the command writes only the LaTeX file (in `build/cv-out/`) and the site keeps the PDF from the repository.
On Netlify, `make deploy` downloads Tectonic before the build.
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
On Netlify, set the variables in "Site configuration", "Environment variables". Then deploy the site again.

Give the address of the private CV only to the persons who must have it.
Keep the file name of the private CV with the prefix `Resume_`. For these files, `netlify.toml` tells search engines not to index the file.

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
- `ai`: how much of the post an AI wrote.
  - `written`: an AI wrote the post from the materials of the author (for example notes, transcripts, forum threads). The author checked it.
    The post page shows a note in grey under the post, next to the date of the last edit.
  - `edited`: the author wrote the post. An AI edited it or added parts (for example the "More" section with sources).
    The post page does not show a note. The field only records the fact in the source file.
  - Do not set the field for a post that the author wrote without an AI.

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

On Netlify, the Netlify Image CDN makes smaller copies of the images when a browser asks for them:

- An image in the post text is 800 px or 1600 px wide. It links to the original file.
- The header image is 800 px or 1600 px wide, with the proportions 16:9. It links to the original file.
- The image on the post card is 480 px or 960 px wide, with the proportions 16:9.

The browser selects the width that agrees with the screen. The CDN does not make an image wider than the original.
The CDN sends WebP or AVIF to browsers that accept these formats.
An image that is already in a link keeps that link.

The Netlify documentation does not tell if the CDN uses the EXIF orientation of an image.
Thus, the build does not send an image with an EXIF rotation to the CDN. The page shows the original file.

Local builds (`npm start` and `npm run build`) use the original images.

Keep all files of a post in the post folder. Do not link images or documents from other sites.
If you must use an image from another host, add the host to `remote_images` in an `[images]` section of `netlify.toml`.
Without this setting, the Netlify Image CDN does not accept the image.

The service worker does not precache the files in `/blog/`, because they are too large.

The build stops with an error if a post has a wrong file name, an unknown field, or no title.
If you add or rename a post while `npm start` runs, restart `npm start`.

## Analytics

The site uses Plausible Analytics on the self-hosted server `plausible.yasiu.pl`.
The script is in the `<head>` of `src/index.html` and `src/blog.html`. All pages use one of these two templates.
The site name in Plausible is `yasiu.pl` (the `data-domain` attribute of the script).
The script also counts file downloads (for example, the CV and the thesis PDF files) and clicks on links to other sites.

To see the statistics, log in to `plausible.yasiu.pl`.
If the site `yasiu.pl` is not in Plausible, add it there before you deploy. Plausible does not record visits for an unknown site.

## Fediverse (Bridgy Fed)

[Bridgy Fed](https://fed.brid.gy/docs) connects the site to the fediverse and to Bluesky.
The fediverse handle of the site is `@yasiu@yasiu.pl`.
The site has these parts for Bridgy Fed:

- The home page has a representative h-card (`u-url`, `u-uid`, `u-photo`, `p-name`, `p-note`). Bridgy Fed makes the profile from it.
- The h-card has a hidden `u-url` link to `acct:yasiu@yasiu.pl`. This link sets the user name `yasiu`. Without it, the handle is `@yasiu.pl@yasiu.pl`.
- Each post page has an `h-entry` with `p-name`, `e-content`, `dt-published`, `u-url`, `p-author`, and a hidden `u-bridgy-fed` link.
- Each post page has a `rel="alternate"` link of the type `application/activity+json`. With this link, a search for the post URL finds the post.
- `netlify.toml` redirects `/.well-known/webfinger` and `/.well-known/host-meta` to Bridgy Fed. Without these redirects, the handle is on `web.brid.gy`, not on `yasiu.pl`.

To connect the site for the first time, enter `yasiu.pl` on <https://fed.brid.gy/web-site>.

Bridgy Fed reads new posts from `/blog/feed.xml`. It finds the feed through the link on the home page.
To publish a post faster, deploy the site and then send a webmention for the post:

```bash
curl -d source=https://yasiu.pl/blog/<slug>/ -d target=https://fed.brid.gy/ https://fed.brid.gy/webmention
```

**Warning:** After the first webmention, Bridgy Fed stops reading the feed.
After that, send a webmention for each new post, each changed post, and each deleted post.

Bridgy Fed does not publish a post that is more than two weeks old.
Each post has a title, so Bridgy Fed sends it as an article. Mastodon shows the title and a link to the post.
Bridgy Fed sends replies, likes, and reposts back to the site as webmentions. The endpoint is webmention.io.

The blog pages also have the tag `<meta name="fediverse:creator" content="@yasiu@0x3c.pl">`.
With this tag, Mastodon shows `@yasiu@0x3c.pl` as the author on link previews of the blog.
To use this function, add `yasiu.pl` to the allowed websites for author attribution in the settings of the `@yasiu@0x3c.pl` account.
