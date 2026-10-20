#!/bin/bash
set -e
echo "Starting deployment at $(date)..."
cd /home/decodexe/decodexe/Blitz-CS-Lab
git pull origin main

# Deploy Frontend build if present
if [ -d "frontend/dist" ]; then
    echo "Updating frontend build in public_html..."
    cp -a frontend/dist/. /home/decodexe/public_html/
    cp /home/decodexe/public_html/index.html /home/decodexe/public_html/200.html 2>/dev/null || true
fi

# Ensure direct LiteSpeed static and media links
ln -sfn /home/decodexe/decodexe/Blitz-CS-Lab/backend/staticfiles /home/decodexe/backend.decodexe.com/static
ln -sfn /home/decodexe/decodexe/Blitz-CS-Lab/backend/media /home/decodexe/backend.decodexe.com/media

# Activate virtualenv and run migrations & collectstatic
source /home/decodexe/virtualenv/decodexe/Blitz-CS-Lab/backend/3.11/bin/activate
cd /home/decodexe/decodexe/Blitz-CS-Lab/backend

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Restarting application..."
mkdir -p /home/decodexe/decodexe/Blitz-CS-Lab/backend/tmp
touch /home/decodexe/decodexe/Blitz-CS-Lab/backend/tmp/restart.txt
mkdir -p /home/decodexe/decodexe/Blitz-CS-Lab/tmp
touch /home/decodexe/decodexe/Blitz-CS-Lab/tmp/restart.txt
mkdir -p /home/decodexe/backend.decodexe.com/tmp
touch /home/decodexe/backend.decodexe.com/tmp/restart.txt

echo "Deployment completed successfully at $(date)."
