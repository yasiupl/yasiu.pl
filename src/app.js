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

fetch(".netlify/functions/lastfm?t=" + Date.now(), {
    headers: {
      "Accept": "application/json"
    }
  })
  .then(response => response.json())
  .then(data => {
    if (!data.recenttracks.track[0]["@attr"]) {
      var minutes = Math.ceil((Date.now() / 1000 - data.recenttracks.track[0].date.uts) / 60);
      var hours = Math.floor(minutes / 60);
      var days = Math.floor(hours / 24);
    }

    document.getElementById("album-cover").src = data.recenttracks.track[0].image[3]["#text"] || "./assets/unknown-artist.png";
    document.getElementById("track").innerHTML = `${data.recenttracks.track[0].artist["#text"] || "Unknown Artist"}: ${data.recenttracks.track[0].name || "A beautiful song"}`;
    if (data.recenttracks.track[0]["@attr"] && data.recenttracks.track[0]["@attr"].nowplaying) {
      document.getElementById("track-status").innerHTML = "I'm listening to…"
      document.getElementById("track-ago").innerHTML = "Right now"
    } else if (minutes < 60) {
      document.getElementById("track-status").innerHTML = "I just stopped listening to…"
      document.getElementById("track-ago").innerHTML = minutes + " Minutes ago"
    } else if (hours < 24) {
      document.getElementById("track-status").innerHTML = "Last played…"
      document.getElementById("track-ago").innerHTML = hours + " Hour" + ((hours-1)? "s" : "") + " ago"
    } else if (days) {
      document.getElementById("track-status").innerHTML = "Last played…"
      document.getElementById("track-ago").innerHTML = days + " Day" + ((days-1)? "s" : "") + " ago"
    } else {
      document.getElementById("track-status").innerHTML = "Last song I've listened to…"
    }
  })
  
fetch(".netlify/functions/owntracks?t=" + Date.now(), {
    headers: {
      "Accept": "application/json"
    }
  })
  .then(response => response.json())
  .then(data => {
    const last_seen = data[0];
    const map_url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${last_seen.lon},${last_seen.lat},12,0/512x512?access_token=pk.eyJ1IjoieWFzaXUiLCJhIjoiY2xod2I1NXE5MGd2ODNsbWQ0cjk3OGxjbSJ9.b2FBXODDAf00U1T4iqLWag`;
    const desciption = `Speed: ${Number.parseFloat(last_seen.vel || 0).toFixed(2)} km/h</br>`;
    
    if (last_seen.inregions[0]) desciption += `Place: ${last_seen.inregions[0]}`;

    document.getElementById("aprs-map").src = map_url;
    document.getElementById("aprs-comment").innerHTML = desciption;
  })
