import fetch from "node-fetch";
const owntracks_user = process.env.owntracks_user;
const owntracks_device = process.env.owntracks_device;
const google_api_key = process.env.google_api_key;
const mapbox_api_token = process.env.mapbox_token;

const API_ENDPOINT = `https://map.yasiu.pl/api/0/last?user=${owntracks_user}&device=${owntracks_device}`;

exports.handler = async (event, context) => {
  try {
    const response = await fetch(API_ENDPOINT, { headers: { "Accept": "application/json" } });
    const data = await response.json();
    let position = data[0];

    // Reverse geocode the position
    if (position && position.lat != null && position.lon != null) {
      const latlng = encodeURIComponent(`${position.lat},${position.lon}`);
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&result_type=neighborhood|political|premise&key=${google_api_key}`;
      try {
        const gRes = await fetch(googleUrl, { headers: { "Accept": "application/json" } });
        const gJson = await gRes.json();
        const formatted = (gJson && Array.isArray(gJson.results) && gJson.results[0] && gJson.results[0].formatted_address) ? gJson.results[0].formatted_address : 'Secret location';
        position.geocoded_name = formatted;
      } catch (gError) {
        position.geocoded_name = 'Secret location';
      }
    } else {
      position.geocoded_name = 'Secret location';
    }

    // Download map image
    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${position.lon},${position.lat},12,0/512x512?access_token=${mapbox_api_token}`;
    try {
      const mapRes = await fetch(mapUrl);
      const imageBuffer = await mapRes.buffer();
      const contentType = mapRes.headers.get('content-type') || 'image/png';
      if (!contentType.startsWith('image/')) {
        throw new Error('Invalid content type for map image');
      }
      position.map_image = `data:${contentType};base64,${imageBuffer.toString('base64')}`;
    } catch (mapError) {
      position.map_image = mapUrl;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(position),
      headers: {
        'Content-type': 'application/json'
      }
    };
  } catch (error) {
    return { statusCode: 422, body: String(error) };
  }
};
