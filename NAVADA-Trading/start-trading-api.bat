@echo off
cd /d C:\Users\leeak\CLAUDE_NAVADA_AGENT\NAVADA-Trading
py -m uvicorn src.api:app --host 0.0.0.0 --port 5678
