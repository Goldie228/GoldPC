# Policy for application services
# Allows reading secrets from specific paths

path "secret/data/goldpc/database/*" {
  capabilities = ["read"]
}

path "secret/data/goldpc/jwt/*" {
  capabilities = ["read"]
}

path "secret/data/goldpc/redis/*" {
  capabilities = ["read"]
}

path "secret/data/goldpc/external/*" {
  capabilities = ["read"]
}

path "secret/data/goldpc/encryption/*" {
  capabilities = ["read"]
}

# Database dynamic credentials
path "database/creds/goldpc-app" {
  capabilities = ["read"]
}

# PKI for mTLS
path "pki/issue/goldpc" {
  capabilities = ["update"]
}
</task_progress>
</write_to_file>