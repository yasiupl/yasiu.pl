import fetch from "node-fetch";

const API_ENDPOINT = `https://map.yasiu.pl/api/0/last`;

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
