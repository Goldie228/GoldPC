# AI Agent Review Checklist

> Краткий чеклист для ИИ-агентов при выполнении Code Review в проекте GoldPC.

---

## ⚡ Quick Review Checklist

### 🏗️ Architecture

```
[ ] SOLID principles not violated
[ ] Clean Architecture layers respected
[ ] No circular dependencies
[ ] Correct module placement
[ ] Appropriate patterns used
```

### 🔒 Security

```
[ ] No hardcoded secrets (passwords, API keys, tokens)
[ ] Input validation present
[ ] SQL injection prevented (parameterized queries)
[ ] XSS prevented (data escaped)
[ ] Authorization checks on protected endpoints
[ ] No OWASP Top 10 vulnerabilities
[ ] Dependencies have no known CVEs
```

### 💼 Business Logic

```
[ ] Algorithm implementation correct
[ ] Edge cases handled (null, empty, boundary)
[ ] Errors handled gracefully
[ ] No swallowed exceptions
[ ] Transactions used where needed
[ ] Idempotency where applicable
[ ] No N+1 queries
```

### 🎨 UX/UI (Frontend only)

```
[ ] Intuitive interface
[ ] Design guidelines followed
[ ] WCAG 2.1 AA accessibility
[ ] Loading/error states present
[ ] Responsive design
```

### 🧪 Tests

```
[ ] Unit tests for new code
[ ] Coverage ≥ 70%
[ ] Edge cases tested
[ ] All tests passing
```

### 📖 Code Quality

```
[ ] Meaningful names
[ ] Functions < 30 lines
[ ] Files < 500 lines
[ ] No magic numbers
[ ] No code duplication
[ ] XML doc / JSDoc for public APIs
```

---

## 🚨 Blockers (Auto-reject)

Немедленно отклонить PR если:

| ❌ Blocker | Action |
|------------|--------|
| Hardcoded secrets | Request immediate removal |
| SQL injection vulnerability | Request parameterized queries |
| Missing auth check | Request authorization attribute |
| Broken tests | Request fix before review |
| Failed security scan | Review and resolve alerts |

---

## 📝 Review Comment Templates

### Critical Issue

```markdown
🔴 **BLOCKER**: [Issue description]

**File**: `path/to/file:line`

**Problem**: [Details]

**Solution**:
```language
// Correct code example
```
```

### Major Issue

```markdown
🟠 **MAJOR**: [Issue description]

**Why**: [Explanation]

**Suggestion**: [How to fix]
```

### Suggestion

```markdown
🔵 **SUGGESTION**: [Improvement idea]

[Optional explanation]
```

---

## ✅ Approval Criteria

PR готов к approve если:

- [ ] Все blockers устранены
- [ ] Все major issues исправлены
- [ ] CI проверки пройдены
- [ ] Минимум 70% coverage

---

## 🔗 Escalation Rules

Эскалировать человеку если:

- Architecture changes → Human Architect
- Security-related → Human Security Lead
- API contract changes → Human Tech Lead
- Agent disagreement → Human Tech Lead
- Complex algorithm → Human Domain Expert

---

## Quick Reference

| Check | Tool |
|-------|------|
| Lint | ESLint / dotnet format |
| Security | Semgrep / Snyk |
| Coverage | Jest / xUnit |
| Architecture | ArchUnit / NetArchTest |
| Contracts | Spectral / Pact |