# ===========================================
# Camping Thailand - Development Commands
# ===========================================

.PHONY: help up down restart logs db-shell studio migrate seed dev build test clean

# Default target
help:
	@echo "Camping Thailand - Development Commands"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make up        - Start all Docker services"
	@echo "  make down      - Stop all Docker services"
	@echo "  make restart   - Restart all Docker services"
	@echo "  make logs      - View logs from all services"
	@echo "  make clean     - Stop services and remove volumes"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-shell  - Open PostgreSQL shell"
	@echo "  make migrate   - Run database migrations"
	@echo "  make seed      - Seed database with sample data"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev       - Start frontend and backend dev servers"
	@echo "  make build     - Build all packages"
	@echo "  make test      - Run all tests"
	@echo ""
	@echo "URLs:"
	@echo "  Frontend:      http://localhost:3090"
	@echo "  Backend API:   http://localhost:3091"
	@echo "  Supabase API:  http://localhost:8000"
	@echo "  Studio:        http://localhost:3100"
	@echo "  Mailpit:       http://localhost:8025"

# ===========================================
# Docker Commands
# ===========================================

# Start all services
up:
	@echo "Starting Docker services..."
	@cp -n .env.docker .env 2>/dev/null || true
	docker compose up -d
	@echo ""
	@echo "Services started!"
	@echo "  Supabase API:  http://localhost:8000"
	@echo "  Studio:        http://localhost:3100"
	@echo "  Mailpit:       http://localhost:8025"
	@echo ""
	@echo "Run 'make dev' to start the application"

# Stop all services
down:
	@echo "Stopping Docker services..."
	docker compose down

# Restart all services
restart: down up

# View logs
logs:
	docker compose logs -f

# View logs for specific service
logs-%:
	docker compose logs -f $*

# Stop and remove all data
clean:
	@echo "Stopping services and removing volumes..."
	docker compose down -v
	@echo "Cleaned!"

# ===========================================
# Database Commands
# ===========================================

# Open PostgreSQL shell
db-shell:
	docker compose exec db psql -U postgres

# Run migrations (copy files to container and execute)
migrate:
	@echo "Running migrations..."
	@for file in supabase/migrations/*.sql; do \
		echo "Applying $$file..."; \
		docker compose exec -T db psql -U postgres -d postgres < "$$file"; \
	done
	@echo "Migrations complete!"

# Seed database
seed:
	@echo "Seeding database..."
	docker compose exec -T db psql -U postgres -d postgres < supabase/seed.sql
	@echo "Seeding complete!"

# Reset database (drop and recreate)
db-reset:
	@echo "Resetting database..."
	docker compose exec db psql -U postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@make migrate
	@make seed
	@echo "Database reset complete!"

# ===========================================
# Development Commands
# ===========================================

# Start dev servers
dev:
	pnpm dev

# Build all packages
build:
	pnpm build

# Run tests
test:
	pnpm test

# Type check
typecheck:
	pnpm typecheck

# Lint
lint:
	pnpm lint

# Install dependencies
install:
	pnpm install

# ===========================================
# Utility Commands
# ===========================================

# Check service status
status:
	docker compose ps

# Pull latest images
pull:
	docker compose pull

# View resource usage
stats:
	docker stats --no-stream
