# AWS MCP Servers for NAVADA Chief of Staff

**Repo**: https://github.com/awslabs/mcp
**Date**: 2026-03-04
**Status**: Pending setup

---

## Tier 1: High Value (Set Up First)

| Server | Why Claude Needs It |
|--------|-------------------|
| **AWS Lambda Tool** | Execute Lambda functions directly. Existing serverless API (`xxqtcilmzi`). Trigger jobs, process data, run scheduled tasks from Telegram without SSH |
| **Amazon S3 / CloudWatch** | Read logs, monitor costs, store/retrieve files. Pairs with existing AWS setup |
| **AWS Cost Explorer** | Proactively monitor AWS spend and alert via Telegram before bills surprise |
| **AWS Pricing** | Real pricing data when planning new infrastructure |
| **Amazon Bedrock Knowledge Bases** | Proper RAG knowledge base for NAVADA docs, proposals, client briefs. Better than ChromaDB free tier limits |

## Tier 2: Operational Power

| Server | Why |
|--------|-----|
| **Amazon DynamoDB** | Fast key-value store for Telegram bot state, session data, cost tracking. Better than SQLite for multi-service access |
| **Amazon SNS/SQS** | Event-driven architecture. Pipeline finds a lead? SNS notifies Telegram. Email arrives? SQS queues it for processing |
| **AWS Step Functions** | Chain complex workflows: scrape leads -> verify emails -> draft outreach -> queue for approval -> send |
| **CloudWatch** | Monitor PM2 services, Oracle VM, Docker containers. Query logs and set alarms from Telegram |
| **Nova Canvas** | AI image generation on AWS. Alternative to DALL-E/Flux for professional content |

## Tier 3: Nice to Have

| Server | Why |
|--------|-----|
| **Amazon Aurora PostgreSQL** | Managed PostgreSQL could replace local prospect pipeline DB. Always available, backed up |
| **AWS IAM** | Manage access keys, roles, policies programmatically |
| **Amazon Location Service** | Geocoding for prospect pipeline. Map client locations, route planning |
| **SageMaker** | Host/fine-tune models (needs proper compute) |

## Skip

- EKS/ECS (overkill for NAVADA's scale)
- Terraform/CDK/IaC (not running complex infra)
- Healthcare, Neptune, Keyspaces, DSQL (no use case)
- Deprecated servers

---

## Day-to-Day Use Cases

**Morning briefing**: Cost Explorer checks overnight spend -> CloudWatch pulls service health -> Lambda runs data aggregation -> SNS sends summary to Telegram

**Lead pipeline**: Step Functions orchestrates full flow. DynamoDB stores pipeline state. SQS queues outreach emails for approval. SNS pings when a prospect replies.

**From Telegram**: "Claude, what did AWS cost this week?" -> Cost Explorer MCP answers instantly. "Deploy the new version" -> Lambda MCP triggers deployment.

---

## Setup Plan

1. Start with **3 servers**: Lambda Tool, Cost Explorer, CloudWatch
2. Clone repo: `git clone https://github.com/awslabs/mcp.git`
3. Configure each server in Claude Code MCP settings
4. Test via Telegram bot
5. Add Tier 2 servers incrementally

## Full Server List (Reference)

### All 50+ Servers from awslabs/mcp

**Infrastructure & Deployment**
- AWS MCP Server (preview) - Secure, auditable AWS interactions with IAM permissions
- AWS Documentation MCP Server - Latest AWS docs and API references
- AWS Knowledge MCP Server - AWS docs, API refs, What's New posts
- AWS IaC MCP Server - CloudFormation, CDK best practices, security validation
- AWS Cloud Control API MCP Server - Direct resource management with security scanning
- AWS CDK MCP Server (DEPRECATED)
- AWS Terraform MCP Server - Terraform workflows with security scanning
- AWS CloudFormation MCP Server - CloudFormation resource management
- Amazon EKS MCP Server - Kubernetes cluster management
- Amazon ECS MCP Server - Container orchestration
- Finch MCP Server - Local container building with ECR integration

**Serverless & Functions**
- AWS Serverless MCP Server - Complete serverless lifecycle with SAM CLI
- AWS Lambda Tool MCP Server - Execute Lambda functions as AI tools

**AI & Machine Learning**
- Amazon Bedrock Knowledge Bases Retrieval - Query enterprise knowledge bases with citations
- Amazon Kendra Index MCP Server - Enterprise search and RAG
- Amazon Q Business MCP Server - AI assistant for ingested content
- Amazon Q Index MCP Server - Search enterprise Q index
- Nova Canvas MCP Server - AI image generation
- AWS Bedrock Data Automation MCP Server - Analyze documents, images, videos, audio
- AWS Bedrock Custom Model Import MCP Server - Manage custom models
- AWS Bedrock AgentCore MCP Server - AgentCore documentation access
- Amazon SageMaker AI MCP Server - SageMaker resource management

**Data & Analytics**
- Amazon DynamoDB MCP Server - Design guidance and data modeling
- Amazon Aurora PostgreSQL MCP Server - PostgreSQL via RDS Data API
- Amazon Aurora MySQL MCP Server - MySQL via RDS Data API
- Amazon Aurora DSQL MCP Server - Distributed SQL
- Amazon DocumentDB MCP Server - MongoDB-compatible operations
- Amazon Neptune MCP Server - Graph database (openCypher/Gremlin)
- Amazon Keyspaces MCP Server - Apache Cassandra-compatible
- Amazon Timestream for InfluxDB MCP Server - Time-series database
- AWS S3 Tables MCP Server - S3 Tables for analytics
- Amazon Redshift MCP Server - Data warehouse operations
- AWS IoT SiteWise MCP Server - Industrial IoT analytics
- Amazon MSK MCP Server - Managed Kafka streaming
- Amazon ElastiCache MCP Server - ElastiCache control plane
- Amazon ElastiCache for Valkey MCP Server - Valkey protocol
- Amazon ElastiCache for Memcached MCP Server - Memcached caching

**Developer Tools**
- AWS IAM MCP Server - IAM management with best practices
- Git Repo Research MCP Server - Semantic code search
- AWS Diagram MCP Server - Architecture diagrams
- Frontend MCP Server - React and web dev guidance
- Synthetic Data MCP Server - Generate test data
- OpenAPI MCP Server - Dynamic API integration

**Integration & Messaging**
- Amazon SNS/SQS MCP Server - Event-driven messaging and queues
- Amazon MQ MCP Server - RabbitMQ/ActiveMQ management
- AWS Step Functions Tool MCP Server - Workflow orchestration
- Amazon Location Service MCP Server - Geocoding, route optimization
- AWS AppSync MCP Server - AppSync backend management

**Cost & Operations**
- AWS Pricing MCP Server - Service pricing and cost estimates
- AWS Cost Explorer MCP Server - Cost analysis and reporting
- Amazon CloudWatch MCP Server - Metrics, alarms, logs
- AWS Managed Prometheus MCP Server - Prometheus-compatible ops

**Support**
- AWS Support MCP Server - Support case management
