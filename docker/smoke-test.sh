#!/usr/bin/env bash
set -euo pipefail
image=${1:?Image required}
name="mafia-smoke-$RANDOM-$$"
volume="$name-data"
cleanup() {
  docker rm -f "$name" >/dev/null 2>&1 || true
  docker volume rm "$volume" >/dev/null 2>&1 || true
}
trap cleanup EXIT
docker volume create "$volume" >/dev/null
# The default production guard must refuse a missing saved world.
if docker run --rm "$image"; then
  echo 'ERROR: empty production database was accepted' >&2
  exit 1
fi
start() {
  docker run -d --name "$name" --mount "source=$volume,target=/app/data" \
    -e REQUIRE_EXISTING_DATABASE="$1" -e BOTS_ENABLED=false -e PUSH_ENABLED=false "$image" >/dev/null
  for attempt in $(seq 1 60); do
    status=$(docker inspect --format '{{.State.Health.Status}}' "$name")
    if [ "$status" = healthy ]; then return; fi
    sleep 2
  done
  docker logs "$name"
  return 1
}
# Opt-out is confined to a disposable CI volume; never used in production Compose.
start false
docker exec "$name" node --input-type=module -e '
  const response = await fetch("http://127.0.0.1:3000/api/register", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username:"DeploySmoke",email:"smoke@example.invalid",password:"isolated-smoke-password-123"})
  });
  if(response.status !== 201) throw new Error(`Registration failed: ${response.status}`);
'
snapshot() {
  docker exec "$name" node --input-type=module -e '
    import {DatabaseSync} from "node:sqlite";
    const db=new DatabaseSync("/app/data/mafia.sqlite",{readOnly:true});
    console.log(JSON.stringify(db.prepare("SELECT id,username,password,role,cash,bank,xp FROM users ORDER BY id").all()));
    db.close();
  '
}
before=$(snapshot)
docker stop "$name" >/dev/null
docker rm "$name" >/dev/null
start true
after=$(snapshot)
test "$before" = "$after"
docker exec "$name" node --input-type=module -e '
  import {existsSync} from "node:fs";
  for(const file of ["starter-data",".git",".env",".npmrc","backups","test","art"])
    if(existsSync(`/app/${file}`)) throw new Error(`Unexpected image content: ${file}`);
  const response=await fetch("http://127.0.0.1:3000/api/health");
  const health=await response.json();
  const {version}=JSON.parse(await (await import("node:fs/promises")).readFile("/app/package.json","utf8"));
  if(!health.ok || health.version!==version) throw new Error("Health version mismatch");
'
echo 'Image health, missing-database guard, account/progress restart and content checks passed.'
