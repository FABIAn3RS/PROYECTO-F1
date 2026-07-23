FROM python:3.11-slim

# Create a non-root user to run the application securely
RUN groupadd -g 1000 appuser && \
    useradd -r -u 1000 -g appuser appuser

WORKDIR /app

COPY requirements.txt .
# Use --only-binary :all: and --require-hashes to prevent package tampering and setup script execution
RUN pip install --no-cache-dir --only-binary :all: --require-hashes -r requirements.txt

COPY app ./app
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
