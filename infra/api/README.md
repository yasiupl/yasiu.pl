# Backend – `api.yasiu.pl`

The backend runs the API routes of the site (`server/` in this repository) on blade12.
The site on Vercel is static. The site gets the data for the live cards from the backend, and it redirects the WebFinger requests to the backend.

| Item | Value |
| --- | --- |
| Address | `https://api.yasiu.pl` |
| Routes | `/api/lastfm`, `/api/location`, `/.well-known/webfinger` |
| Container | `yasiu-pl-api` (compose project `yasiu-pl`) |
| Image | `yasiu-pl-api`, built on blade12 from this repository ([`Dockerfile`](Dockerfile)) |
| Secrets | `yasiu-pl/lastfm-api-key` and `yasiu-pl/mapbox-token` in `hosts/argo/blade12/secrets.yaml` (repository `infrastruktura`, sops) |
| Data | None. The routes keep their answers in memory. |

## How the backend works

- The [`Dockerfile`](Dockerfile) builds the routes with Nitro (preset `node-server`). The image contains only the server (`.output/`).
- The routes read the secrets from the files in `LASTFM_API_KEY_FILE` and `MAPBOX_TOKEN_FILE` (see `server/utils/env.js`).
- The route `/api/location` reads the OwnTracks Recorder in the docker network `iot` (`http://owntracks-recorder:8083`). This connection needs no login.
- Each route keeps its last good answer in memory (see the route rules in `nitro.config.mjs`). After a restart, the first request gets a new answer.
- Traefik sends the requests for `api.yasiu.pl` to the container. The container publishes no ports.

## First deployment

Do the steps in this sequence.
If `docker compose up` runs before the rebuild of blade12, docker creates a directory in place of each missing secret file. Then sops-nix cannot write the secret.

1. Add the secrets to sops. Use a device with an admin key that opens `secrets.yaml`. In the folder of the `infrastruktura` repository, in `nix develop`, do these commands:

   ```bash
   sops set hosts/argo/blade12/secrets.yaml '["yasiu-pl"]["lastfm-api-key"]' '"<API key of Last.fm>"'
   sops set hosts/argo/blade12/secrets.yaml '["yasiu-pl"]["mapbox-token"]' '"<access token of Mapbox>"'
   ```

   The values are in the settings of the Vercel project ("Settings", "Environment Variables").
2. In Cloudflare, add the DNS record `api.yasiu.pl`. Use the same target and the same proxy setting as for `owntracks.yasiu.pl`.
3. Rebuild blade12 from the `infrastruktura` repository. The command asks for the `sudo` password of blade12:

   ```bash
   ./scripts/rebuild-switch.sh --remote yasiu@blade12.argo.y4s.io --attr blade12-argo
   ```

4. Copy the `infrastruktura` repository to blade12: `./scripts/sync-remote.sh yasiu@blade12.argo.y4s.io`.
5. On blade12, make sure that the secrets are files, not directories:

   ```bash
   ls -l /run/secrets/yasiu-pl/
   ```

6. On blade12, build and start the stack:

   ```bash
   cd ~/infrastruktura/hosts/argo/blade12/services/yasiu.pl/infra/api
   docker compose up -d --build
   ```

7. Test the backend:

   ```bash
   curl -s https://api.yasiu.pl/api/lastfm | head -c 200
   curl -s https://api.yasiu.pl/api/location | head -c 200
   curl -s 'https://api.yasiu.pl/.well-known/webfinger?resource=acct:yasiu@yasiu.pl'
   ```

## Update

1. Deploy the change as [`../README.md`](../README.md) tells ("Deploy a change").
2. On blade12, run `docker compose up -d --build` in this folder. Docker builds a new image from the new commit.

## Errors

The routes send the cause of an error in the response, but never the value of a secret. For example, `{"statusMessage": "Last.fm: 403", "data": {"LASTFM_API_KEY": false}}` tells that the backend has no API key of Last.fm.
To see the log of the container: `docker logs yasiu-pl-api`.
