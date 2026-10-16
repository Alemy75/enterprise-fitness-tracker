# Enterprise Fitness Tracker

Приложение для тренеров сети фитнес-клубов: прогресс клиентов хранится в клубной базе.
План, решения и задачи — в [BACKLOG.md](BACKLOG.md).

## Структура

| Путь                 | Что это                                                                        |
| -------------------- | ------------------------------------------------------------------------------ |
| `apps/api`           | NestJS: API (`dist/main.js`) и worker (`dist/worker.js`), Drizzle + PostgreSQL |
| `apps/web`           | TanStack Start: PWA тренера и админки + BFF                                    |
| `packages/contracts` | zod-схемы, общие для API и web                                                 |
| `infra/compose`      | PostgreSQL, Redis, Mailpit для локальной разработки                            |

## Запуск

Нужны Node 24, pnpm 11 (`corepack enable`) и Docker.

```bash
pnpm install
cp .env.example .env
docker compose -f infra/compose/docker-compose.yml up -d
pnpm build
pnpm --filter @eft/api db:migrate
pnpm dev
```

API — http://127.0.0.1:3001/health/ready, приложение — http://127.0.0.1:3000.

### Без Docker

Вместо PostgreSQL можно поднять PGlite-сервер (PostgreSQL на WASM, данные в `apps/api/.pglite`).
В `.env` укажите `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres`, затем в трёх терминалах:

```bash
pnpm --filter @eft/api db:local
```

```bash
pnpm build && pnpm --filter @eft/api db:migrate:local && pnpm --filter @eft/api start:local
```

```bash
pnpm --filter @eft/web dev
```

Для Claude Code эти же команды описаны в `.claude/launch.json` (`db`, `api`, `web`).

## Проверки

```bash
pnpm lint && pnpm typecheck && pnpm test
```

- Тесты API используют PGlite (PostgreSQL в процессе), Docker для них не нужен.
- Офлайн-тесты PWA: `pnpm --filter @eft/web build && pnpm --filter @eft/web test:e2e` (нужен установленный Chrome).

## Миграции

```bash
pnpm --filter @eft/api db:generate      # SQL из схемы в apps/api/src/db/schema
pnpm --filter @eft/api exec drizzle-kit generate --custom --name <name>  # ручная миграция
```
