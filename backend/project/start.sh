#!/bin/bash

# Run migrations
python manage.py migrate

# Start the server
daphne -b 0.0.0.0 -p 8000 project.asgi:application