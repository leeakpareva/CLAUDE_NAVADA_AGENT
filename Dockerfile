# NAVADA Edge — Node.js Application Image
# Used for containerised deployment of automation services

FROM node:22-slim

# Security: non-root user
RUN groupadd -r navada && useradd -r -g navada -m navada

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

# Copy application code
COPY Automation/ ./Automation/
COPY LeadPipeline/ ./LeadPipeline/
COPY Manager/ ./Manager/

# Create required directories
RUN mkdir -p Automation/logs Automation/uploads Automation/kb && \
    chown -R navada:navada /app

USER navada

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3456/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

EXPOSE 3456 4000 5678 7777

CMD ["node", "Automation/telegram-bot.js"]
