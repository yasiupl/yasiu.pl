import fetch from "node-fetch";
const owntracks_user = process.env.owntracks_user;
const owntracks_device = process.env.owntracks_device;

const API_ENDPOINT = `https://map.yasiu.pl/api/0/last?user=${owntracks_user}&device=${owntracks_device}`;

exports.handler = async (event, context) => {
  return fetch(API_ENDPOINT, { headers: { "Accept": "application/json" } })
    .then(response => response.json())
    .then(data => ({
        statusCode: 200,
        body: JSON.stringify(data),
        headers: {
            'Content-type': 'application/json'
        }
    }))
    .catch(error => ({ statusCode: 422, body: String(error) }));
};
