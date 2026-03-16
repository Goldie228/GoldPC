# GoldPC Network Policies - Zero Trust Configuration

This directory contains Kubernetes Network Policies implementing a Zero Trust network security model for the GoldPC application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    ingress-nginx namespace                   │ │
│  │                     [Ingress Controller]                     │ │
│  └────────────────────────────┬────────────────────────────────┘ │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                       goldpc namespace                       │ │
│  │                                                              │ │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │ │
│  │  │  Frontend   │     │   Backend   │     │   Database  │   │ │
│  │  │   (nginx)   │────▶│   (.NET)    │────▶│ (PostgreSQL)│   │ │
│  │  │   :80       │     │   :8080     │     │   :5432     │   │ │
│  │  └─────────────┘     └──────┬──────┘     └─────────────┘   │ │
│  │                             │                               │ │
│  │                             ▼                               │ │
│  │                      ┌─────────────┐                        │ │
│  │                      │    Redis    │                        │ │
│  │                      │   :6379     │                        │ │
│  │                      └─────────────┘                        │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │              DEFAULT DENY ALL POLICY                  │   │ │
│  │  │     All traffic blocked unless explicitly allowed     │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Policy Files

| File | Purpose | Priority |
|------|---------|----------|
| `default-deny.yaml` | Denies all ingress/egress traffic by default | Critical |
| `allow-dns.yaml` | Allows DNS resolution for all pods | Critical |
| `allow-from-ingress.yaml` | Allows traffic from ingress controller | High |
| `backend-to-database.yaml` | Allows backend to access PostgreSQL/Redis | High |

## Deployment Order

**IMPORTANT:** Apply policies in the following order to avoid connectivity issues:

```bash
# 1. First, apply DNS policy (critical for service discovery)
kubectl apply -f allow-dns.yaml

# 2. Apply default deny policy
kubectl apply -f default-deny.yaml

# 3. Apply allow policies
kubectl apply -f allow-from-ingress.yaml
kubectl apply -f backend-to-database.yaml
```

Or apply all at once:
```bash
kubectl apply -f .
```

## Policy Details

### 1. default-deny.yaml

```yaml
spec:
  podSelector: {}  # Selects all pods in namespace
  policyTypes:
    - Ingress
    - Egress
```

**Effect:** All ingress and egress traffic is denied by default. This is the foundation of Zero Trust networking.

### 2. allow-dns.yaml

```yaml
spec:
  podSelector: {}  # Applies to all pods
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - port: 53
          protocol: UDP
        - port: 53
          protocol: TCP
```

**Effect:** Allows DNS queries to kube-dns/CoreDNS for hostname resolution.

### 3. allow-from-ingress.yaml

```yaml
spec:
  podSelector:
    matchLabels:
      app: goldpc-backend  # Targets backend pods
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - port: 8080
```

**Effect:** Allows the NGINX Ingress Controller to route traffic to backend and frontend pods.

### 4. backend-to-database.yaml

**Contains multiple policies:**

- `backend-to-postgresql`: Backend → PostgreSQL on port 5432
- `backend-to-redis`: Backend → Redis on port 6379
- `allow-internal-services`: Inter-service communication within goldpc
- `allow-external-apis`: External HTTPS API calls (payment gateway, SMS, etc.)

## Labels Reference

Ensure your deployments have the correct labels:

```yaml
# Backend deployment
metadata:
  labels:
    app: goldpc-backend
    app.kubernetes.io/part-of: goldpc

# Frontend deployment
metadata:
  labels:
    app: goldpc-frontend
    app.kubernetes.io/part-of: goldpc

# PostgreSQL
metadata:
  labels:
    app: postgresql

# Redis
metadata:
  labels:
    app: redis
```

## Verification

### Check applied policies:
```bash
kubectl get networkpolicies -n goldpc
```

### Test connectivity:
```bash
# Test backend to database
kubectl exec -n goldpc deploy/goldpc-backend -- nc -zv postgresql 5432

# Test DNS resolution
kubectl exec -n goldpc deploy/goldpc-backend -- nslookup kubernetes.default

# Test external API access
kubectl exec -n goldpc deploy/goldpc-backend -- curl -v https://api.example.com
```

### Debug blocked traffic:
```bash
# Check if policy exists
kubectl describe networkpolicy -n goldpc default-deny-all

# Check pod labels
kubectl get pods -n goldpc --show-labels
```

## Security Considerations

1. **Zero Trust Principle:** All traffic is denied by default. Only explicitly allowed traffic is permitted.

2. **Least Privilege:** Each policy grants only the minimum required access.

3. **Namespace Isolation:** Traffic between namespaces requires explicit policies.

4. **External Access:** External API calls are restricted to HTTPS (port 443) only.

5. **Database Isolation:** Only backend pods can connect to PostgreSQL and Redis.

## Troubleshooting

### Connection timeout errors:
1. Verify the policy exists: `kubectl get networkpolicies -n goldpc`
2. Check pod labels match policy selectors
3. Verify DNS policy is applied first

### DNS resolution failures:
1. Ensure `allow-dns.yaml` is applied
2. Check kube-dns is running: `kubectl get pods -n kube-system -l k8s-app=kube-dns`

### Ingress not reaching pods:
1. Verify ingress controller namespace label
2. Check backend/frontend pod labels
3. Ensure `allow-from-ingress.yaml` targets correct pods

## Related Documents

- [07-security.md](../../development-plan/07-security.md) - Security requirements
- [Threat Model](../../docs/security/threat-model.md) - Security architecture