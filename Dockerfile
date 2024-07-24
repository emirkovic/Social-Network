# Use the official Python image from the Docker Hub
FROM python:3.12.3-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Copy the requirements files
COPY requirements/ /app/requirements/

# Install system dependencies and pip packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pip packages
RUN pip install --upgrade pip && \
    pip install -r /app/requirements/base.txt && \
    pip install -r /app/requirements/local.txt && \
    pip install -r /app/requirements/production.txt

# Copy the application code to the working directory
COPY . /app/

# Run collectstatic command
RUN python manage.py collectstatic --noinput

# Expose port 8000
EXPOSE 8000

# Start the application with Gunicorn for production, or the Django development server for development
CMD ["sh", "-c", "if [ \"$DJANGO_ENV\" = \"production\" ]; then gunicorn config.wsgi:application --bind 0.0.0.0:8000; else python manage.py runserver 0.0.0.0:8000; fi"]
