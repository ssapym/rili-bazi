#!/bin/bash
cd "$(dirname "$0")"
echo "Starting local server at http://localhost:8000"
echo "Please open your browser and visit http://localhost:8000"
python3 -m http.server 8000
