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

document.getElementById("logo-container").innerText = location.hostname

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
