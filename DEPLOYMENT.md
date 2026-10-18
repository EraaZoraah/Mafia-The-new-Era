# Versioned images and Portainer updates

This keeps Mafia's existing flat source layout and SQLite storage. Like Apex League,
GitHub Actions tests the source, publishes a versioned GHCR image and then creates
a GitHub release. Unlike Apex, Mafia uses SQLite, not PostgreSQL; do not copy Apex's
database service, volumes or bootstrap credentials.

## Release process (maintainers)

- Pull requests run `npm ci --ignore-scripts`, the complete isolated `npm test`
  suite on the latest Node 22 and 24, the language audit, a Docker build, image
  health/persistence smoke tests and Compose validation. PRs publish nothing.
- After merge, a successful run on `main` publishes
  `ghcr.io/eraazoraah/mafia-the-new-era:<package.json version>` for Linux AMD64 and
  ARM64 using `GITHUB_TOKEN`. It then creates `container-v<version>` at the tested commit.
  No VPS credentials, SSH access or automatic deployment are involved.
- Keep `package.json`, `package-lock.json`, the version/build in `server.js` and
  release notes consistent when making a new application release. This deployment
  PR keeps the current application version, 1.18.6. The repository already has
  historical `v1.18.x` source tags, so container releases use a separate
  `container-v` tag prefix and never move those source tags. Existing container release tags are
  never rebuilt: bump the version for each subsequent release. Do not use `latest`.
- The workflow can be manually retried on `main`. If image publication succeeds
  but release creation fails, rerun the failed job before making other changes.
  A tag with no release deliberately fails the release check; investigate it
  rather than deleting or moving existing release tags.
- The image uses Node 24 (satisfying Node >=22), `npm ci --omit=dev --ignore-scripts`,
  the committed lockfile and the existing `/api/health` endpoint. SQLite is
  `node:sqlite`; no native npm SQLite build is needed. `web-push` is installed
  even while device push is paused. No frontend compilation is needed.

## Keep source private; make the image public

Keep **EraaZoraah/Mafia-The-new-Era private**. GHCR package visibility is separate.
The first publication defaults to private. After the first successful release,
the package owner/admin must open their GitHub **Packages → mafia-the-new-era →
Package settings → Change visibility → Public** and complete GitHub's confirmation.
If inherited repository permissions prevent this, disable inheritance in the
package access settings while retaining this repository under **Manage Actions
access** with write access. Do not change repository visibility. For an existing
package, grant the repository Actions access if publishing is denied.

Verify an anonymous pull of the exact version before using it in Portainer:

```sh
docker --config "$(mktemp -d)" pull ghcr.io/eraazoraah/mafia-the-new-era:1.18.6
```

Public images expose the included runtime JavaScript and public assets to anyone
who pulls them. Repository history, tests, private starter accounts and deployment
secrets are excluded. The Docker build context and COPY commands use allowlists;
`starter-data/`, `data/`, backups, `.env*`, `.npmrc`, keys and SQLite files are
excluded. Never add credentials to application source or public assets.

GitHub references: [Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
and [package visibility](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility).

## First transition from the current local image

The currently supplied stack runs `mafia-the-new-era:11.0` with `pull_policy: never`.
That local tag does not establish the application's version or migration history.
Before upgrading, record its `/api/health` result, image ID, full stack text and
environment, then test the new image against a **disposable copy** of the stopped
database. Verify existing account login, balances, XP, families and saved progress.
The repository's migration tests cannot establish compatibility with an unseen
live database. Keep the old local image available until recovery has been tested.

1. Complete the backup procedure below. Confirm the existing host directory
   `/opt/docker/mafia-the-new-era/data` contains the intended nonempty `mafia.sqlite`.
   Do not initialize a new world or copy `starter-data` onto the VPS.
2. Wait for a successful release and verified anonymous GHCR pull. In the existing
   Portainer stack, use [compose.yml](compose.yml). Set the stack variables:

   | Variable | Value |
   | --- | --- |
   | `MAFIA_IMAGE` | `ghcr.io/eraazoraah/mafia-the-new-era:1.18.6` (only after it is published) |
   | `PUBLIC_ORIGIN` | The existing final HTTPS origin, e.g. `https://mafia.example.com`, without a trailing slash |

3. Retain any existing required environment settings. `PUSH_ENABLED=false` keeps
   real-device push paused. The normal bot scheduler stays unchanged; preserve
   `BOTS_ENABLED=false` if your current environment intentionally pauses it.
4. Keep service/container `mafia`, the external `proxy` network and the exact bind
   mount `/opt/docker/mafia-the-new-era/data:/app/data`. There is no new named data
   volume, database service or published host port. Nginx Proxy Manager keeps
   forwarding HTTP to `mafia:3000`; retain its domain and TLS configuration.
5. Choose **Update the stack**, enable **Re-pull image**, and redeploy. Remove the
   old `pull_policy: never`; the supplied Compose uses `always`. Watchtower stays
   disabled. Do not remove the data directory or use any reset/seed operation.
6. Wait for Healthy; inspect logs, check `/api/health` for the chosen version,
   then sign in with an existing account and verify progress and family state.
   Keep the site in maintenance until these checks pass.

The production startup guard reads the existing database before the app starts.
It refuses missing/empty/corrupt databases, missing account tables, empty accounts
and inaccessible storage. The bind mount also disables automatic host-directory
creation. If startup fails, investigate the mount, permissions or backup; **never
set `REQUIRE_EXISTING_DATABASE=false` to bypass an upgrade failure**. That opt-out
is solely for deliberate new worlds and disposable tests. A valid but wrong
database cannot be identified automatically: operator account/progress checks
remain necessary. The image retains the existing root container execution model
to avoid changing ownership of the current bind mount; it does not chown data.

## Routine updates

Read the release notes, take and verify a fresh backup, change only `MAFIA_IMAGE`
to the successful release's exact version, then **Update the stack → Re-pull
image**. Keep stack name, mount, environment and proxy settings. Verify health,
account login and progress. No local rebuild or source download is needed on the
VPS. This PR does not implement an in-game update checker or automatic updater.

## Backups before every upgrade

SQLite runs in WAL mode. Copying only `mafia.sqlite` while the app is running can
lose committed transactions. Use a brief maintenance window: stop `mafia`, archive
the **whole data directory**, including any `mafia.sqlite-wal` and `mafia.sqlite-shm`,
and retain the old Compose/environment and image reference. Keep an off-VPS copy.
For example, on the Docker host (review paths and available disk space first):

```sh
docker stop mafia
backup="/opt/docker/mafia-the-new-era/backups/pre-update-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
install -d -m 700 /opt/docker/mafia-the-new-era/backups
(umask 077; tar -C /opt/docker/mafia-the-new-era -czf "$backup" data)
tar -tzf "$backup"
```

Keep the app stopped until the snapshot has finished and the new stack is ready.
If postponing the update, `docker start mafia` resumes the existing container.
Store backups privately: they contain password hashes, account information and
progress. Verify recovery by extracting to an isolated directory, running SQLite
`PRAGMA integrity_check` and `PRAGMA foreign_key_check`, and starting the image
against that disposable copy on a separate private network, without a production
proxy or real device push. Compare recorded account IDs, roles, balances, XP and
family state. Never run test/reset/seed scripts on the live bind mount.

## Recovery

Startup runs the application's existing schema/data migrations and normal game
settlement; preserving the mount does not make those writes reversible. An image
rollback alone cannot undo a migration. Stop the failed container, preserve its
data separately for investigation, restore the **complete pre-upgrade directory**
into an empty recovery location and verify it with the prior image before routing
players back. Do not overlay old database/WAL files onto newer data. Restore with
the original permissions and exact bind mount only after checking the recovery.
Any activity after the backup is lost when restoring it.

For the first transition, the old image is local: restore the saved original
stack (`mafia-the-new-era:11.0`, `pull_policy: never`) as part of recovery. Later,
use the previous published GHCR version with its matching pre-upgrade data.
Do not delete the old image, backups or data as part of an ordinary stack update.
