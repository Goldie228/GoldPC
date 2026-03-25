resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

resource "kubernetes_namespace" "ingress" {
  metadata {
    name = "ingress-nginx"
  }
}

resource "kubernetes_namespace" "argo_rollouts" {
  metadata {
    name = "argo-rollouts"
  }
}

# 1. Ingress Nginx
resource "helm_release" "ingress_nginx" {
  name       = "ingress-nginx"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  namespace  = kubernetes_namespace.ingress.metadata[0].name
  version    = "4.9.0"

  set {
    name  = "controller.service.type"
    value = "LoadBalancer"
  }
}

# 2. Argo Rollouts
resource "helm_release" "argo_rollouts" {
  name       = "argo-rollouts"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-rollouts"
  namespace  = kubernetes_namespace.argo_rollouts.metadata[0].name
  version    = "2.35.1"

  set {
    name  = "dashboard.enabled"
    value = "true"
  }
}

resource "kubernetes_config_map" "goldpc_dashboards" {
  metadata {
    name      = "goldpc-dashboards"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    labels = {
      grafana_dashboard = "1"
    }
  }

  data = {
    "goldpc-overview.json" = file("${path.module}/../monitoring/dashboards/goldpc-overview.json")
  }
}

# 3. Prometheus & Grafana (kube-prometheus-stack)
resource "helm_release" "prometheus_stack" {
  name       = "kube-prometheus-stack"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "56.0.0"

  values = [
    <<EOF
grafana:
  adminPassword: "admin" # Replace with secret in production
  sidecar:
    dashboards:
      enabled: true
      label: grafana_dashboard
  ingress:
    enabled: true
    ingressClassName: nginx
    hosts:
      - grafana.local
EOF
  ]
}

# 4. Loki & Promtail
resource "helm_release" "loki_stack" {
  name       = "loki"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "2.9.11"

  values = [
    <<EOF
loki:
  persistence:
    enabled: true
    size: 10Gi
promtail:
  enabled: true
EOF
  ]

  depends_on = [helm_release.prometheus_stack]
}
