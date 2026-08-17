FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p media

EXPOSE 8000

# Las migraciones corren al arrancar el contenedor (y no como preDeployCommand de
# Render, que no existe en el plan free). Si fallan, el contenedor muere y el deploy
# se marca como fallido: preferible a servir una API contra una BD sin tablas.
# "exec" deja a uvicorn como PID 1 para que reciba las señales de parada de Render.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
