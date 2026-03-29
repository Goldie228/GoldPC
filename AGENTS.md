# GoldPC — подсказки для AI-агентов

## Локальный запуск для тестов (актуально)

Обычно проект поднимают для ручной проверки так:

```bash
./scripts/dev-local.sh --tail
```

Скрипт поднимает нужную инфраструктуру в Docker, сидирует каталог, стартует микросервисы и фронт; `--tail` показывает прогресс и потом логи. Подробности и опции — [`.cursor/skills/goldpc-local-dev/SKILL.md`](.cursor/skills/goldpc-local-dev/SKILL.md).

**Важно:** фрагменты **README** и **docs/architecture** могут расходиться с реальной практикой; при сомнениях опирайся на `scripts/dev-local.sh` и код.

---

## Конфигурация Cursor (`.cursor/`)

| Тип | Путь | Назначение |
|-----|------|------------|
| **Rules** | `.cursor/rules/*.mdc` | Постоянные правила (общие, C#, React, тесты, Docker) |
| **Skills** | `.cursor/skills/*/SKILL.md` | Домен, тесты, локальный запуск, [стек микросервисов](.cursor/skills/goldpc-microservices-stack/SKILL.md) |
| **MCP** | `.cursor/mcp.json` | `skills-server` — `npx -y @skills-server/mcp`, навыки из `.agents/skills/` (`SKILLS_DIR`) |
| **Subagents** | `.cursor/agents/*.md` | Специализации: backend, frontend, verifier, infra-review |
| **Commands** | `.cursor/commands/*.md` | Slash-команды: `/test-all`, `/review-diff`, и др. |

Стек: .NET 8 микросервисы, React + Vite, PostgreSQL, Redis, RabbitMQ. Обзор продукта — [README.md](README.md) (проверяй актуальность команд с `dev-local.sh`).
