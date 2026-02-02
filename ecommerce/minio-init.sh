#!/bin/sh

echo "Starting MinIO initialization..."

# Wait for MinIO container to be accessible
echo "Waiting for MinIO to be accessible..."
MAX_RETRIES=60
RETRY_COUNT=0

# First, check if we can reach MinIO server
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # Try to set alias - this will fail if MinIO is not ready
  if mc alias set myminio http://minio:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin} >/dev/null 2>&1; then
    echo "MinIO alias set successfully!"
    break
  fi
  echo "MinIO is not ready yet. Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "ERROR: MinIO did not become ready in time. Exiting."
  exit 1
fi

# Wait a bit more to ensure MinIO is fully ready
sleep 3

# Verify MinIO is ready
echo "Verifying MinIO is ready..."
RETRY_COUNT=0
while [ $RETRY_COUNT -lt 10 ]; do
  if mc ready myminio 2>/dev/null; then
    echo "MinIO is ready!"
    break
  fi
  echo "Waiting for MinIO to be fully ready... ($RETRY_COUNT/10)"
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

# Create bucket
BUCKET_NAME=${MINIO_BUCKET_NAME:-ecommerce}
echo "Creating bucket: ${BUCKET_NAME}"
if mc mb myminio/${BUCKET_NAME} 2>&1; then
  echo "Bucket '${BUCKET_NAME}' created successfully!"
else
  echo "Bucket '${BUCKET_NAME}' already exists or creation failed (continuing anyway)..."
fi

# Set bucket policy to public read
echo "Setting bucket policy to download (public read)..."
if mc anonymous set download myminio/${BUCKET_NAME} 2>&1; then
  echo "Bucket policy set successfully!"
else
  echo "Warning: Could not set bucket policy (continuing anyway)..."
fi

echo "MinIO initialization completed! Bucket: ${BUCKET_NAME}"
