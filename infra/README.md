# Infrastructure of yasiu.pl

This folder defines the services of yasiu.pl that run on our own server.
The site itself is static and runs on Vercel (see "Hosting" in [`../README.md`](../README.md)).

| Service | Address | Folder | Server |
| --- | --- | --- | --- |
| Backend: the API routes of the site and WebFinger | `api.yasiu.pl` | [`api/`](api/) | blade12 (argo) |

## Division between the repositories

The `infrastruktura` repository includes this repository as a submodule at `hosts/argo/blade12/services/yasiu.pl`.

| Part | Repository | File |
| --- | --- | --- |
| Containers: `docker-compose.yml` and `Dockerfile` | `yasiu.pl` (this repository) | `infra/<service>/` |
| Secrets (sops) | `infrastruktura` | `hosts/argo/blade12/secrets.yaml` |
| Declaration of the secrets | `infrastruktura` | `hosts/argo/blade12/configuration.nix` |

The host part stays in the `infrastruktura` repository for two reasons:

- By default, a Nix flake does not see the content of a submodule. A `.nix` file in this repository does not get into the configuration of the host.
- Sops encrypts `secrets.yaml` with the key of blade12. The rules for the recipients are in the `.sops.yaml` file of the `infrastruktura` repository.

## Rules

- Do not write secrets into this repository. Write a secret into `hosts/argo/blade12/secrets.yaml` with `sops`.
- A container reads a secret from a file in `/run/secrets/`. Do not give a secret in an environment variable or in an `.env` file.
- Each service has its own folder with a `README.md` file. The file tells how to do the first deployment and an update.

## Deploy a change

1. Change the files in this repository. Merge the change into the branch that the submodule follows (the `branch` in `.gitmodules` of the `infrastruktura` repository).
2. In the `infrastruktura` repository, move the submodule to the new commit:

   ```bash
   git submodule update --remote hosts/argo/blade12/services/yasiu.pl
   git add hosts/argo/blade12/services/yasiu.pl
   git commit -m "chore(yasiu.pl): update the submodule"
   ```

3. Copy the `infrastruktura` repository to blade12: `./scripts/sync-remote.sh yasiu@blade12.argo.y4s.io`.
4. On blade12, run `docker compose up -d --build` in the folder of the service.

A change in `configuration.nix` also needs a rebuild of blade12 before step 4 (see [`api/README.md`](api/README.md)).
