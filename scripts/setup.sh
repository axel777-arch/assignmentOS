#!/usr/bin/env sh
set -eu
command -v docker >/dev/null 2>&1 || { echo "Docker is required." >&2; exit 1; }
[ -f .env ] || cp .env.example .env
command -v openssl >/dev/null 2>&1 || { echo "OpenSSL is required to generate local secrets." >&2; exit 1; }
secrets_changed=0
for key in POSTGRES_PASSWORD JWT_SECRET; do
	current=$(sed -n "s/^${key}=//p" .env | head -n 1)
	case "$current" in
		""|*replace*|*change-this*)
			if [ "$key" = "JWT_SECRET" ]; then value=$(openssl rand -base64 48 | tr '+/' '-_' | tr -d '='); else value=$(openssl rand -hex 48); fi
			if grep -q "^${key}=" .env; then sed -i.bak "s|^${key}=.*|${key}=${value}|" .env; rm -f .env.bak; else printf '%s=%s\n' "$key" "$value" >> .env; fi
			[ "$key" = "POSTGRES_PASSWORD" ] && secrets_changed=1
			;;
	esac
done
if [ "$secrets_changed" = 1 ] && docker compose ps --services --status running 2>/dev/null | grep -qx db; then
	db_user=$(sed -n 's/^POSTGRES_USER=//p' .env | head -n 1); db_user=${db_user:-assignmentos}
	db_name=$(sed -n 's/^POSTGRES_DB=//p' .env | head -n 1); db_name=${db_name:-assignmentos}
	db_password=$(sed -n 's/^POSTGRES_PASSWORD=//p' .env | head -n 1)
	case "$db_user" in *[!A-Za-z0-9_]*|[0-9]*|"") echo "POSTGRES_USER must be a simple SQL role name." >&2; exit 1;; esac
	docker compose exec -T db psql -U "$db_user" -d "$db_name" -v ON_ERROR_STOP=1 -c "ALTER ROLE \"$db_user\" WITH PASSWORD '$db_password';"
fi
echo "Local database and session secrets are configured in .env."
docker compose up --build
