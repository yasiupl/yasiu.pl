// The "Last seen..." card of the home page: the name of the area where Marcin is, and a map of
// that area. The response does not contain the GPS position (see server/utils/region.js).
//
// 1. The OwnTracks Recorder gives the last position. The Recorder needs a user name and a password.
// 2. Nominatim tells if the position is in a city or a town. Overpass gives the areas around it.
// 3. The Mapbox Static Images API makes a map that fits the area.
//
// Nominatim and Overpass are free services of the OpenStreetMap community. Their usage policies
// require a User-Agent that identifies the site, and few requests: Nominatim permits 1 request in
// a second, Overpass 2 requests at the same time from one IP address. The CDN of the platform
// keeps each response for 5 minutes (Cache-Control below), so the site sends few requests.
// An Overpass server is sometimes overloaded. Then the route tries the next server in OVERPASS.
const HEADERS = { 'User-Agent': 'yasiu.pl (+https://yasiu.pl)' };
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const TIMEOUT = 10000;

// On the move: at this speed (km/h) or faster, if the position is not older than EN_ROUTE_AGE (s).
// A walk is not "en route". A bicycle, a car and a train are.
const EN_ROUTE_SPEED = 15;
const EN_ROUTE_AGE = 3600;

async function area(lat, lon, enRoute) {
  const query = `[out:json][timeout:20];is_in(${lat},${lon})->.a;(rel(pivot.a);way(pivot.a););out tags bb;` +
    'area.a[boundary=administrative][admin_level=8]->.m;node(area.m)[place~"^(city|town)$"];out tags;';
  const overpassArea = async () => {
    for (const server of OVERPASS) {
      const data = await $fetch(server, {
        method: 'POST', body: new URLSearchParams({ data: query }), headers: HEADERS, timeout: TIMEOUT
      }).catch(() => null);
      if (data) return data;
    }
    throw new Error('No Overpass server answered');
  };
  const [place, overpass] = await Promise.all([
    // Without Nominatim, settlementOf() uses only the town nodes from Overpass.
    $fetch('https://nominatim.openstreetmap.org/reverse', {
      query: { format: 'jsonv2', lat, lon, addressdetails: 1 }, headers: HEADERS, timeout: TIMEOUT
    }).catch(() => ({})),
    overpassArea()
  ]);
  const elements = overpass.elements || [];
  const address = place.address || {};
  return selectRegion(elements, { settlement: settlementOf(elements, address), country: address.country_code, enRoute });
}

async function map(bounds, token) {
  const box = [bounds.minlon, bounds.minlat, bounds.maxlon, bounds.maxlat].join(',');
  const response = await $fetch.raw(
    `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/[${box}]/512x512`,
    { query: { padding: 24, access_token: token }, responseType: 'arrayBuffer' });
  const type = response.headers.get('content-type') || '';
  if (!type.startsWith('image/')) throw new Error('Mapbox did not send an image');
  // A data URL: the page does not see the Mapbox token.
  return `data:${type};base64,${Buffer.from(response._data).toString('base64')}`;
}

export default defineEventHandler(async (event) => {
  const user = fromEnv('OWNTRACKS_USER', 'owntracks_user');
  const device = fromEnv('OWNTRACKS_DEVICE', 'owntracks_device');
  // The password gives access only to /api/0/last of the Recorder.
  const login = `${fromEnv('OWNTRACKS_USERNAME') || user}:${fromEnv('OWNTRACKS_PASSWORD')}`;
  const mapboxToken = fromEnv('MAPBOX_TOKEN', 'mapbox_token');
  const [last] = await $fetch(`${fromEnv('OWNTRACKS_URL') || 'https://map.yasiu.pl'}/api/0/last`, {
    query: { user, device }, timeout: TIMEOUT,
    headers: { Authorization: `Basic ${Buffer.from(login).toString('base64')}` }
  }).catch((error) => {
    // The error tells which variables have a value (yes or no), never the values.
    throw createError({
      statusCode: 502,
      statusMessage: `OwnTracks Recorder: ${error.status || error.message}`,
      data: {
        OWNTRACKS_USER: Boolean(user),
        OWNTRACKS_DEVICE: Boolean(device),
        OWNTRACKS_USERNAME: Boolean(fromEnv('OWNTRACKS_USERNAME')),
        OWNTRACKS_PASSWORD: Boolean(fromEnv('OWNTRACKS_PASSWORD'))
      }
    });
  });
  if (!last || last.lat == null || last.lon == null) {
    throw createError({ statusCode: 404, statusMessage: 'No position' });
  }

  const enRoute = (last.vel || 0) >= EN_ROUTE_SPEED && Date.now() / 1000 - last.tst < EN_ROUTE_AGE;
  // Without the area, send an error and not "Secret location": the CDN does not keep an error,
  // and it continues to send the last good response (stale-while-revalidate).
  const region = await area(last.lat, last.lon, enRoute).catch(() => {
    throw createError({ statusCode: 503, statusMessage: 'OpenStreetMap services are not available' });
  });
  const bounds = region && region.bounds;
  const mapImage = bounds && mapboxToken ? await map(bounds, mapboxToken).catch(() => null) : null;

  setResponseHeader(event, 'Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
  return {
    name: region ? region.name : null,
    tst: last.tst,
    // The speed only on the move. When Marcin stays in a place, the speed tells nothing.
    vel: enRoute ? last.vel : null,
    map_image: mapImage
  };
});
