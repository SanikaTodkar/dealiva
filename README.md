# Dealiva Backend (FastAPI + PostgreSQL)

## Setup (Pipenv)

```bash
pip install pipenv
pipenv install
```

Create your environment file:

```bash
copy .env.example .env
```

## PostgreSQL

Create the database `dealiva_db` (example using `psql`):

```bash
createdb dealiva_db
```

If your credentials/host differ, update `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:5432/dealiva_db
```

## Run

```bash
pipenv run uvicorn main:app --reload
```

API will be available at:
- `http://127.0.0.1:8000/api/v1/health`
- Swagger UI: `http://127.0.0.1:8000/docs`

## Project structure

```
app/
  core/        # settings/config
  db/          # SQLAlchemy engine/session/base
  models/      # SQLAlchemy ORM models
  routers/     # FastAPI routers
  schemas/     # Pydantic schemas
  api.py       # API router aggregation
main.py        # FastAPI entrypoint
```

