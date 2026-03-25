ui = true
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}
storage "file" {
  path = "/vault/file"
}
default_max_request_duration = "90s"
disable_mlock = true
