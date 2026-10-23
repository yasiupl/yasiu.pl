const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);

if ('serviceWorker' in navigator) {
  if (isLocal) {
    // No offline cache during development: remove any worker and cache left
    // from an earlier run, so edits always show on reload.
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
    if (window.caches) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .catch((err) => console.log('yasiu.pl service worker install failed: ', err));
    });
  }
}

document.getElementById("logo-container").innerText = location.hostname;

// The menu panel on a phone: a link to a section of the same page (for example #work) does not
// close the popover. Close it on each link.
document.getElementById("nav-menu").addEventListener("click", (event) => {
  if (event.target.closest("a") && event.currentTarget.matches(":popover-open")) event.currentTarget.hidePopover();
});

// Theme toggle: system -> light -> dark -> system. Saved per browser.
(function () {
  const root = document.documentElement;
  const button = document.getElementById("theme-toggle");
  const order = ["system", "light", "dark"];
  const svg = (body) => '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' + body + "</svg>";
  const icons = {
    system: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>'),
    light: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    dark: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>')
  };
  let current = root.getAttribute("theme") || "system";

  function apply(theme) {
    current = theme;
    // Materialize 2 reads the theme from <html theme="light|dark">; no attribute = follow the OS.
    if (theme === "system") root.removeAttribute("theme");
    else root.setAttribute("theme", theme);
    try {
      if (theme === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", theme);
    } catch (e) {}
    button.innerHTML = icons[theme];
    button.setAttribute("aria-label", "Theme: " + (theme === "system" ? "follow system" : theme));
  }

  apply(current);
  button.addEventListener("click", () => apply(order[(order.indexOf(current) + 1) % order.length]));
})();

// Timeline filters: show one type of entry. Without JavaScript all entries show.
(function () {
  const buttons = document.querySelectorAll(".tl-filter");
  const years = document.querySelectorAll(".tl-year");
  const defaultOpen = [...years].map((y) => y.open);
  buttons.forEach((button) => button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    years.forEach((year, i) => {
      let shown = 0;
      year.querySelectorAll(".tl-item").forEach((item) => {
        item.hidden = filter !== "all" && item.dataset.type !== filter;
        if (!item.hidden) shown++;
      });
      year.hidden = shown === 0;
      year.querySelector(".tl-count").textContent = shown;
      // A filter opens every year that has entries; "All" restores the default.
      year.open = filter === "all" ? defaultOpen[i] : shown > 0;
    });
  }));
})();

function getAgoString(timestampSeconds) {
  const minutes = Math.ceil((Date.now() / 1000 - timestampSeconds) / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 60) {
    return minutes + " Minute" + ((minutes-1)? "s" : "") + " ago";
  } else if (hours < 24) {
    return hours + " Hour" + ((hours-1)? "s" : "") + " ago";
  } else {
    return days + " Day" + ((days-1)? "s" : "") + " ago";
  }
}

// The number of views under a blog post (see server/api/views.get.js). The number stays hidden
// if the backend does not answer or if the post has no views yet.
const postViews = document.querySelector(".post-views[data-views-path]");
if (postViews) {
  fetch(API_BASE + "/api/views", { headers: { "Accept": "application/json" } })
    .then(response => response.ok ? response.json() : Promise.reject(response.status))
    .then(views => {
      const count = views[postViews.dataset.viewsPath];
      if (!count) return;
      // The word agrees with the number (for example 1 wyświetlenie, 2 wyświetlenia, 5 wyświetleń).
      const lang = postViews.closest("[lang]").lang;
      const form = new Intl.PluralRules(lang).select(count);
      postViews.querySelector(".post-views-count").textContent = count.toLocaleString(lang);
      postViews.querySelector(".post-views-word").textContent = postViews.dataset[form] || postViews.dataset.other;
      postViews.hidden = false;
    })
    .catch(() => {});
}

// The comments under a blog post, from two sources (see "Post footer" in README.md):
// - the fediverse: the replies, likes and boosts sent to @blog@yasiu.pl (server/api/comments.get.js).
//   The backend makes the HTML of the replies safe.
// - webmention.io: the webmentions of the post. These are other websites, and the fediverse through
//   Bridgy. The script shows only the text of a webmention, never its HTML.
// A reply that comes from both sources shows one time. With no replies, the card shows "be the first".
// If no source answers, the card shows only how to comment.
const postComments = document.querySelector(".post-comments[data-webmention-target]");
if (postComments) {
  const slug = postComments.dataset.commentsSlug;
  const target = postComments.dataset.webmentionTarget;
  const json = (response) => response.ok ? response.json() : Promise.reject(response.status);
  const fediverse = slug
    ? fetch(API_BASE + "/api/comments?slug=" + encodeURIComponent(slug), { headers: { "Accept": "application/json" } }).then(json)
    : Promise.reject("no actor");
  // Old webmentions can have the address without the last slash.
  const targets = [target, target.replace(/\/$/, "")].map(t => "&target[]=" + encodeURIComponent(t)).join("");
  const webmentions = fetch("https://webmention.io/api/mentions.jf2?per-page=200" + targets).then(json);
  Promise.allSettled([fediverse, webmentions]).then(([fedi, wm]) => {
    if (fedi.status === "rejected" && wm.status === "rejected") return;
    const data = fedi.status === "fulfilled" ? fedi.value : { likes: 0, boosts: 0, replies: [] };
    const mentions = wm.status === "fulfilled" ? (wm.value.children || []) : [];
    const lang = postComments.closest("[lang]").lang;
    const web = (url) => (typeof url === "string" && /^https?:\/\//i.test(url) ? url : null);

    // The likes and boosts: the sum of the two sources.
    const likes = data.likes + mentions.filter(m => m["wm-property"] === "like-of").length;
    const boosts = data.boosts + mentions.filter(m => m["wm-property"] === "repost-of").length;
    const counted = (count, kind) => {
      const form = new Intl.PluralRules(lang).select(count);
      const key = kind + form.charAt(0).toUpperCase() + form.slice(1);
      return count.toLocaleString(lang) + " " + (postComments.dataset[key] || postComments.dataset[kind + "Other"]);
    };
    const reactions = [likes && counted(likes, "likes"), boosts && counted(boosts, "boosts")].filter(Boolean);
    if (reactions.length) {
      const line = postComments.querySelector(".post-reactions");
      line.textContent = reactions.join(" · ");
      line.hidden = false;
    }

    // The replies from the fediverse, then the replies and mentions from webmention.io.
    const items = data.replies.map(reply => ({ ...reply, isReply: reply.inReplyTo !== data.object }));
    const seen = new Set(items.flatMap(item => [item.url, item.id]));
    const MAX = 280; // The number of characters of a long webmention that the card shows.
    for (const m of mentions) {
      const kind = m["wm-property"];
      const url = web(m.url);
      if ((kind !== "in-reply-to" && kind !== "mention-of") || !url || seen.has(url)) continue;
      seen.add(url);
      const a = m.author || {};
      const authorUrl = web(a.url);
      const full = ((m.content && m.content.text) || "").replace(/\s+/g, " ").trim();
      let text = full;
      if (full.length > MAX) {
        const cut = full.slice(0, MAX);
        text = cut.slice(0, Math.max(cut.lastIndexOf(" "), MAX * 0.6)).replace(/[\s,.;:–-]+$/, "") + "…";
      }
      items.push({
        url,
        published: m.published || m["wm-received"],
        author: { name: a.name || (authorUrl ? new URL(authorUrl).host : "?"), handle: authorUrl ? new URL(authorUrl).host : "", url: authorUrl || url, icon: web(a.photo) },
        // A mention is often a post on another website: the card shows its title.
        title: kind === "mention-of" ? (m.name && !full.startsWith(m.name.trim()) ? m.name : postComments.dataset.mentioned) : null,
        text,
        more: text !== full
      });
    }
    items.sort((a, b) => new Date(a.published) - new Date(b.published));

    const list = postComments.querySelector(".post-comments-list");
    const date = new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short" });
    const link = (className, href) => {
      const element = document.createElement("a");
      element.className = className;
      element.href = href;
      element.rel = "nofollow noopener ugc";
      element.target = "_blank";
      return element;
    };
    for (const reply of items) {
      const item = document.createElement("li");
      item.className = "post-comment" + (reply.isReply ? " is-reply" : "");
      const author = link("post-comment-author", reply.author.url);
      if (reply.author.icon) {
        const icon = document.createElement("img");
        icon.src = reply.author.icon;
        icon.alt = "";
        icon.width = icon.height = 32;
        icon.loading = "lazy";
        icon.referrerPolicy = "no-referrer";
        author.append(icon);
      }
      const name = document.createElement("span");
      name.className = "post-comment-name";
      name.textContent = reply.author.name;
      const handle = document.createElement("span");
      handle.className = "post-comment-handle";
      handle.textContent = reply.author.handle;
      author.append(name, handle);
      const time = link("post-comment-date", reply.url);
      time.textContent = reply.published ? date.format(new Date(reply.published)) : reply.url;
      const content = document.createElement("div");
      content.className = "post-comment-content";
      if (reply.content !== undefined) {
        content.innerHTML = reply.content;
      } else {
        const paragraph = document.createElement("p");
        if (reply.title) {
          const title = document.createElement("strong");
          title.textContent = reply.title;
          paragraph.append(title, reply.text ? " " : "");
        }
        paragraph.append(reply.text);
        if (reply.more) {
          const more = link("post-comment-more", reply.url);
          more.textContent = postComments.dataset.more + " →";
          paragraph.append(" ", more);
        }
        content.append(paragraph);
      }
      if (reply.summary) {
        // A content warning: the text stays closed until the reader opens it.
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = reply.summary;
        details.append(summary, content);
        item.append(author, time, details);
      } else {
        item.append(author, time, content);
      }
      list.append(item);
    }
    list.hidden = !items.length;
    postComments.querySelector(".post-comments-empty").hidden = items.length > 0;
  });
}

// The button that copies the address of a post (for the search of a fediverse app).
const copyLink = document.querySelector(".post-copy-link");
if (copyLink && navigator.clipboard) {
  copyLink.hidden = false;
  copyLink.addEventListener("click", () => {
    navigator.clipboard.writeText(document.querySelector(".post-copy-url").textContent).then(() => {
      const label = copyLink.textContent;
      copyLink.textContent = copyLink.dataset.copied;
      setTimeout(() => { copyLink.textContent = label; }, 2000);
    }).catch(() => {});
  });
}

// Live widgets: only the home page has them.
if (document.getElementById("track")) {
  // The API routes are in server/api/ and run on the backend (API_BASE, see webpack.config.js). The
  // backend keeps their responses for some minutes. Do not add a changing query (for example a time
  // stamp): each request then goes to Last.fm and OpenStreetMap.
  fetch(API_BASE + "/api/lastfm", {
      headers: {
        "Accept": "application/json"
      }
    })
    .then(response => response.ok ? response.json() : Promise.reject(response.status))
    .then(data => {
      document.getElementById("album-cover").src = data.recenttracks.track[0].image[3]["#text"] || "./assets/unknown-artist.png";
      document.getElementById("track").innerHTML = `${data.recenttracks.track[0].artist["#text"] || "Unknown Artist"}: ${data.recenttracks.track[0].name || "A beautiful song"}`;
    
      if (data.recenttracks.track[0]["@attr"] && data.recenttracks.track[0]["@attr"].nowplaying) {
        document.getElementById("track-status").innerHTML = "I'm listening to…"
        document.getElementById("track-ago").innerHTML = "Right now"
      } else {
        const agoString = getAgoString(data.recenttracks.track[0].date.uts);
        const minutes = Math.ceil((Date.now() / 1000 - data.recenttracks.track[0].date.uts) / 60);
      
        if (minutes < 60) {
          document.getElementById("track-status").innerHTML = "I just stopped listening to…"
        } else {
          document.getElementById("track-status").innerHTML = "Last played…"
        }
        document.getElementById("track-ago").innerHTML = agoString;
      }
    })
    // Without an answer, the card keeps its default text.
    .catch(() => {});
  
  // The area (a district, a town or a region), not the GPS position. See server/api/location.get.js.
  fetch(API_BASE + "/api/location", {
      headers: {
        "Accept": "application/json"
      }
    })
    .then(response => response.ok ? response.json() : Promise.reject(response.status))
    .then(last_seen => {
      // The names come from OpenStreetMap: write them as text, not as HTML.
      const comment = document.getElementById("position-comment");
      comment.textContent = last_seen.name || "Secret location";
      // The speed is there only on the move ("En route").
      if (last_seen.vel != null) {
        comment.append(document.createElement("br"), `Speed: ${Math.round(last_seen.vel)} km/h`);
      }

      document.getElementById("position-ago").innerHTML = getAgoString(last_seen.tst);

      if (last_seen.map_image) document.getElementById("position-map").src = last_seen.map_image;
    })
    .catch(() => {});
}
