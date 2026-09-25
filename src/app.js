if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(function () {
                console.log('rocket.watch serviceworker install successful');
            })

            .catch(function (err) {
                console.log('rocket.watch serviceworker install failed: ', err);
            });
    });
}

document.getElementById("logo-container").innerText = location.hostname;

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
  let current = root.dataset.theme || "system";

  function apply(theme) {
    current = theme;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
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

fetch(".netlify/functions/lastfm?t=" + Date.now(), {
    headers: {
      "Accept": "application/json"
    }
  })
  .then(response => response.json())
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
  
fetch(".netlify/functions/owntracks?t=" + Date.now(), {
    headers: {
      "Accept": "application/json"
    }
  })
  .then(response => response.json())
  .then(last_seen => {

    let position_comment = ``;
    position_comment += `${last_seen.geocoded_name || "Secret location"}</br>`;
    position_comment += `Speed: ${Number.parseFloat(last_seen.vel || 0).toFixed(2)} km/h</br>`;
    document.getElementById("position-comment").innerHTML = position_comment;

    document.getElementById("position-ago").innerHTML = getAgoString(last_seen.tst);

    if (last_seen.map_image) document.getElementById("position-map").src = last_seen.map_image;
  })
