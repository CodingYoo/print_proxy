@echo off
python -m uvicorn app.main:app --host 127.0.0.1 --port 8569 --reload
