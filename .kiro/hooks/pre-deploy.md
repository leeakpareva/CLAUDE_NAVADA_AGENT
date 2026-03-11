# Pre-Deploy Validation Hook

## Trigger
Before any file in `Automation/cloudflare-worker/` or `navada-dashboard/` is saved.

## Action
Validate JavaScript syntax with `node -c` before allowing deploy.

## Command
```bash
node -c "$FILE_PATH"
```

## Description
Prevents deploying broken code to production. Catches syntax errors before they reach Worker or EC2.
