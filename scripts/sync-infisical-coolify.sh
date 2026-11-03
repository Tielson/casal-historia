#!/usr/bin/env bash
# Sincroniza os segredos do Infisical (projeto casal-historia, ambiente prod) para as
# variáveis de ambiente do recurso no Coolify e dispara um redeploy.
# Requer: curl, jq. Variáveis necessárias (nunca commitar valores):
#   INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET   (machine identity, Universal Auth)
#   COOLIFY_API_TOKEN                              (Coolify > Keys & Tokens > API tokens)
# Opcionais: INFISICAL_ENV (prod), NO_DEPLOY=1, e os IDs abaixo.
set -euo pipefail
INFISICAL_URL="${INFISICAL_URL:-https://app.infisical.com}"
INFISICAL_PROJECT_ID="${INFISICAL_PROJECT_ID:-e7fee54c-03d6-419c-be87-cb4d28199ad8}"
INFISICAL_ENV="${INFISICAL_ENV:-prod}"
COOLIFY_URL="${COOLIFY_URL:-https://coolify.dominus-hub.com.br}"
COOLIFY_APP_UUID="${COOLIFY_APP_UUID:-r1nl2ke2wxcavqjaklwjoham}"
# Definidas fixas no docker-compose.prod.yml; não precisam ir pro Coolify.
SKIP_KEYS='["NODE_ENV","PORT","REDIS_URL","DATABASE_URL"]'

TOKEN=$(curl -fsS -X POST "$INFISICAL_URL/api/v1/auth/universal-auth/login" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --arg i "$INFISICAL_CLIENT_ID" --arg s "$INFISICAL_CLIENT_SECRET" '{clientId:$i,clientSecret:$s}')" | jq -r .accessToken)

PAYLOAD=$(curl -fsS -H "Authorization: Bearer $TOKEN" \
  "$INFISICAL_URL/api/v3/secrets/raw?workspaceId=$INFISICAL_PROJECT_ID&environment=$INFISICAL_ENV&secretPath=/&expandSecretReferences=true" |
  jq --argjson skip "$SKIP_KEYS" '{data: [.secrets[] | select(.secretKey as $k | $skip | index($k) | not) | {key: .secretKey, value: .secretValue, is_preview: false}]}')
echo "Sincronizando $(echo "$PAYLOAD" | jq '.data | length') variáveis ($INFISICAL_ENV) para o Coolify..."

curl -fsS -X PATCH "$COOLIFY_URL/api/v1/applications/$COOLIFY_APP_UUID/envs/bulk" \
  -H "Authorization: Bearer $COOLIFY_API_TOKEN" -H 'Content-Type: application/json' \
  -d "$PAYLOAD" >/dev/null
echo "Variáveis atualizadas."

if [ "${NO_DEPLOY:-0}" != 1 ]; then
  curl -fsS -X POST "$COOLIFY_URL/api/v1/deploy?uuid=$COOLIFY_APP_UUID" \
    -H "Authorization: Bearer $COOLIFY_API_TOKEN" | jq -r '.deployments[0].message'
fi
