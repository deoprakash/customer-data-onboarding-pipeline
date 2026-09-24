# 🚀 AI-Driven Customer Data Onboarding Pipeline

> **Turn messy customer data into production-ready data — automatically, asynchronously, and with human approval.**

An enterprise-style customer data onboarding platform designed for **B2B SaaS teams** that regularly receive customer data in inconsistent CSV formats.

Instead of building a custom ingestion script for every customer, this platform uses **AI-assisted schema mapping, human approval, configurable transformations, asynchronous processing, validation, and PostgreSQL persistence** to create a reusable customer onboarding workflow.

---

## 📌 Table of Contents

* [Problem Statement](#-problem-statement)
* [Solution](#-solution)
* [Key Features](#-key-features)
* [Architecture](#️-architecture)
* [Technology Stack](#️-technology-stack)
* [End-to-End Workflow](#-end-to-end-workflow)
* [AI Schema Mapping](#-ai-schema-mapping)
* [Human-in-the-Loop](#-human-in-the-loop)
* [Data Processing Pipeline](#-data-processing-pipeline)
* [Redis Job Queue](#-redis-job-queue)
* [Database Design](#️-database-design)
* [Project Structure](#-project-structure)
* [Getting Started](#-getting-started)
* [Running the Application](#-running-the-application)
* [Testing the Pipeline](#-testing-the-pipeline)
* [API Endpoints](#-api-endpoints)
* [Example Data](#-example-data)
* [Why This Architecture](#-why-this-architecture)
* [Production Evolution](#-production-evolution)
* [Roadmap](#-roadmap)
* [Engineering Principles](#-engineering-principles)
* [What This Project Demonstrates](#-what-this-project-demonstrates)
* [Future Improvements](#-future-improvements)
* [Author](#-author)

---

# 🎯 Problem Statement

B2B SaaS companies often struggle with customer onboarding when customers provide historical data in different formats.

Every enterprise customer may have:

* Different column names
* Different date formats
* Different naming conventions
* Missing values
* Invalid records
* Different data types
* Different source systems
* Large CSV files

For example, one customer might provide:

```csv
customer_no,full_name,email_id,mobile,joined_on
1001,John Smith,john@gmail.com,9876543210,15/08/2026
```

Another customer might provide:

```csv
id,name,email_address,phone_number,registration_date
B001,Alice Brown,alice@beta.com,9999999999,2026-08-20
```

While the destination platform expects:

```text
customer_id
first_name
last_name
email
phone
created_at
```

Traditionally, a data engineer might need to write a custom ingestion script for every customer.

That creates:

```text
Customer A → Custom script
Customer B → Custom script
Customer C → Custom script
Customer D → Custom script
```

As the number of customers grows, this becomes expensive, difficult to maintain, and slow to scale.

---

# 💡 Solution

This project introduces a **Dynamic, AI-Driven Customer Data Onboarding Pipeline**.

The core idea is simple:

> **Customer-specific differences should be configuration, not custom code.**

The platform provides a reusable onboarding workflow:

```text
Customer Data
      ↓
Schema Discovery
      ↓
AI Schema Mapping
      ↓
Human Review
      ↓
Mapping Approval
      ↓
Configuration
      ↓
File Upload
      ↓
Redis Queue
      ↓
Python Worker
      ↓
Validation
      ↓
Transformation
      ↓
PostgreSQL
```

The same processing engine can onboard customers with completely different source schemas.

---

# ✨ Key Features

## 🤖 AI-Powered Schema Mapping

The system analyzes an unknown customer schema and suggests mappings to the canonical destination schema.

Example:

```text
client_code          → customer_id
customer_full_name   → first_name + last_name
email_address        → email
mobile_number        → phone
registration_date    → created_at
```

The LLM can also provide:

* Mapping confidence
* Transformation suggestions
* Date format detection
* Mapping explanations

---

## 👨‍💻 Human-in-the-Loop Approval

AI-generated mappings are reviewed before they are used for production ingestion.

```text
AI Recommendation
       ↓
Engineer Review
       ↓
Modify if required
       ↓
Approve
       ↓
Save Configuration
       ↓
Production Ingestion
```

The AI recommends.

The engineer decides.

This provides an additional safety layer for customer data.

---

## ⚙️ Configuration-Driven ETL

Customer-specific rules are represented through configuration.

Example:

```yaml
customer_id:
  source: client_code
  required: true

first_name:
  source: customer_full_name
  required: true
  transformation: first_name

last_name:
  source: customer_full_name
  required: true
  transformation: last_name

email:
  source: email_address
  required: true

phone:
  source: mobile_number
  required: true

created_at:
  source: registration_date
  format: "%Y-%m-%d"
  required: true
```

The Python data engine does not need a new script for every customer.

---

## ⚡ Asynchronous Processing

Large customer files should not block HTTP requests.

The application uses Redis as an asynchronous job queue.

```text
React
  ↓
Node.js API
  ↓
Redis Queue
  ↓
Python Worker
  ↓
PostgreSQL
```

The API can immediately return a job ID while the data engine processes the file in the background.

---

## 🛡️ Data Validation

Invalid records are isolated instead of causing the entire pipeline to fail.

Example:

```text
Row 1 → Valid
Row 2 → Valid
Row 3 → Missing email
Row 4 → Invalid date
Row 5 → Valid
```

Result:

```text
Records received : 5
Records valid    : 3
Records rejected : 2
```

---

## 📊 Job Tracking

Every onboarding request receives a unique job ID.

Example:

```text
job-1725638291
```

Jobs move through states such as:

```text
QUEUED
   ↓
PROCESSING
   ↓
COMPLETED
```

or:

```text
QUEUED
   ↓
PROCESSING
   ↓
FAILED
```

This allows the frontend to track asynchronous processing.

---

## 📝 Auditability

Important customer onboarding actions can be recorded for traceability.

Examples:

```text
Customer created
AI mapping generated
Mapping approved
Mapping modified
Mapping rolled back
Job created
Job started
Job completed
Job failed
Job rerun
```

---

# 🏗️ Architecture

The application follows a decoupled, microservices-style architecture.

```text
                         ┌──────────────────────┐
                         │    React Frontend    │
                         │                      │
                         │ Dashboard            │
                         │ Customer Management  │
                         │ File Upload          │
                         │ Mapping Review       │
                         │ Job Monitoring       │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP
                                    ▼
                         ┌──────────────────────┐
                         │ Node.js + Express    │
                         │                      │
                         │ REST API             │
                         │ File Upload          │
                         │ Job Creation         │
                         │ AI Proxy             │
                         └───────┬───────┬──────┘
                                 │       │
                           Queue │       │ SQL
                                 │       │
                                 ▼       ▼
                         ┌──────────┐  ┌──────────────┐
                         │  Redis   │  │ PostgreSQL   │
                         │          │  │              │
                         │ Job      │  │ Customers    │
                         │ Queue    │  │ Jobs         │
                         └────┬─────┘  │ Config       │
                              │        │ Audit Logs   │
                              │        └──────────────┘
                              ▼
                    ┌─────────────────────┐
                    │ Python Data Engine  │
                    │                     │
                    │ Worker              │
                    │ Profiling           │
                    │ Validation          │
                    │ Transformation      │
                    │ Loading             │
                    └──────────┬──────────┘
                               │
                               ▼
                         PostgreSQL
```

---

# 🛠️ Technology Stack

| Layer          | Technology                   | Responsibility                      |
| -------------- | ---------------------------- | ----------------------------------- |
| Frontend       | React + Vite                 | Dashboard and user interaction      |
| Styling        | Vanilla CSS                  | Custom UI and responsive design     |
| Backend        | Node.js + Express            | REST API and orchestration          |
| File Upload    | Multer                       | Multipart CSV uploads               |
| Queue          | Redis                        | Asynchronous job processing         |
| Data Engine    | Python                       | Data processing and ETL             |
| Processing     | Pandas                       | CSV parsing and transformation      |
| Database ORM   | SQLAlchemy                   | PostgreSQL interaction              |
| Database       | PostgreSQL                   | Persistent application data         |
| AI / LLM       | Groq / OpenAI-compatible API | Schema mapping                      |
| Infrastructure | Docker                       | Local infrastructure and deployment |

---

# 🔄 End-to-End Workflow

## 1. Customer Creation

A new customer is registered through the dashboard.

Example:

```text
Customer: GlobalMart
Status: Active
```

---

## 2. Upload Sample CSV

The user uploads a representative sample of the customer's data.

Example:

```csv
client_code,customer_full_name,email_address,mobile_number,registration_date
GM10001,Arjun Mehta,arjun.mehta@gmail.com,9876501001,2026-09-01
GM10002,Priya Sharma,priya.sharma@gmail.com,9876501002,2026-09-02
```

The system discovers:

```text
client_code
customer_full_name
email_address
mobile_number
registration_date
```

---

## 3. AI Schema Mapping

The source schema is provided to the LLM along with the canonical schema.

The AI proposes:

```text
client_code
    ↓
customer_id

customer_full_name
    ↓
first_name + last_name

email_address
    ↓
email

mobile_number
    ↓
phone

registration_date
    ↓
created_at
```

---

## 4. Human Review

The engineer reviews the AI-generated mapping.

Example:

| Source Field       | Target Field | Confidence |
| ------------------ | ------------ | ---------: |
| client_code        | customer_id  |        99% |
| customer_full_name | first_name   |        96% |
| customer_full_name | last_name    |        96% |
| email_address      | email        |        99% |
| mobile_number      | phone        |        98% |
| registration_date  | created_at   |        99% |

The engineer can modify the mapping before approval.

---

## 5. Save Configuration

Once approved, the mapping becomes the customer's ingestion configuration.

Conceptually:

```text
Customer
   │
   └── Configuration
          │
          ├── Source → Target mappings
          ├── Required fields
          ├── Transformations
          └── Date formats
```

---

## 6. Upload Full Dataset

The customer uploads the complete historical CSV.

The frontend sends the file to:

```http
POST /jobs
```

The Node.js backend:

1. Receives the file
2. Saves the file
3. Creates a job payload
4. Pushes the job into Redis
5. Returns a job ID

---

## 7. Redis Queue

The job is stored in:

```text
customer_onboarding_jobs
```

Example message:

```json
{
  "job_id": "job-1725638291",
  "customer": "globalmart",
  "file": "path/to/file.csv"
}
```

---

## 8. Python Worker

The Python worker waits for jobs from Redis.

When a job arrives:

```text
Redis
  ↓
Python Worker
  ↓
Load Configuration
  ↓
Read CSV
  ↓
Validate
  ↓
Transform
  ↓
Load
  ↓
Update Job Status
```

---

# 🤖 AI Schema Mapping

Schema mapping is one of the most important parts of the platform.

## Source Schema

```text
client_code
customer_full_name
email_address
mobile_number
registration_date
```

## Canonical Schema

```text
customer_id
first_name
last_name
email
phone
created_at
```

The LLM generates a structured mapping.

Example:

```json
{
  "customer_id": {
    "source": "client_code",
    "confidence": 0.99
  },
  "first_name": {
    "source": "customer_full_name",
    "transformation": "first_name",
    "confidence": 0.96
  },
  "last_name": {
    "source": "customer_full_name",
    "transformation": "last_name",
    "confidence": 0.96
  },
  "email": {
    "source": "email_address",
    "confidence": 0.99
  },
  "phone": {
    "source": "mobile_number",
    "confidence": 0.98
  },
  "created_at": {
    "source": "registration_date",
    "format": "%Y-%m-%d",
    "confidence": 0.99
  }
}
```

### Important Design Principle

The LLM should **recommend** mappings rather than silently changing production configuration.

```text
LLM
 ↓
Recommendation
 ↓
Human Review
 ↓
Approval
 ↓
Production Configuration
```

This makes the AI layer safer and easier to audit.

---

# 👨‍💻 Human-in-the-Loop

Human approval is an important part of the architecture.

For example, an AI model may incorrectly interpret:

```text
customer_name
```

as:

```text
first_name
```

when it actually represents:

```text
first_name + last_name
```

The engineer can correct the mapping before ingestion.

This creates a workflow where:

```text
AI → Accelerates
Human → Approves
System → Executes
```

---

# 🐍 Data Processing Pipeline

The Python data engine performs the following stages:

```text
                  CSV
                   │
                   ▼
            ┌─────────────┐
            │   Profile   │
            └──────┬──────┘
                   │
                   ▼
            ┌─────────────┐
            │  Validate   │
            └──────┬──────┘
                   │
             ┌─────┴─────┐
             │           │
             ▼           ▼
          Valid        Invalid
             │           │
             ▼           ▼
        Transform     Reject
             │
             ▼
           Load
             │
             ▼
        PostgreSQL
```

---

# 🔍 Validation

The validator checks rules such as:

### Required fields

```text
customer_id
first_name
email
phone
created_at
```

### Email validation

```text
john@gmail.com       ✓
alice@example.com   ✓
invalid-email       ✗
```

### Date validation

```text
2026-09-01          ✓
01/09/2026          depends on configuration
invalid-date        ✗
```

Invalid records are rejected and recorded instead of crashing the complete pipeline.

---

# 🔄 Transformation

Source data is converted into the canonical format.

Example:

```text
customer_full_name = "Arjun Mehta"
```

becomes:

```text
first_name = "Arjun"
last_name  = "Mehta"
```

Date transformation:

```text
15/08/2026
```

can become:

```text
2026-08-15
```

Transformation rules are determined by the customer's configuration.

---

# ⚡ Redis Job Queue

Redis is used as the asynchronous communication layer between Node.js and Python.

```text
Node.js
   │
   │ RPUSH
   ▼
Redis List
customer_onboarding_jobs
   │
   │ BLPOP
   ▼
Python Worker
```

## Why Redis?

Without a queue:

```text
Browser
   ↓
Node API
   ↓
Process large CSV
   ↓
Wait...
   ↓
HTTP Response
```

With Redis:

```text
Browser
   ↓
Node API
   ↓
Queue Job
   ↓
HTTP 202 Accepted

          Redis
            ↓
      Python Worker
            ↓
      Process CSV
```

Benefits:

* Asynchronous processing
* Decoupled services
* Responsive APIs
* Multiple worker support
* Clear job boundaries
* Horizontal scalability

---

# 🗄️ Database Design

The canonical customer table stores normalized customer data.

```sql
CREATE TABLE customers (
    customer_id VARCHAR(100) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at DATE
);
```

The onboarding job table tracks processing:

```text
onboarding_jobs
-------------------------
job_id
customer
file_name
status
records_received
records_valid
records_rejected
error_message
created_at
updated_at
```

Future versions can include:

```text
customer_configs
customer_mappings
mapping_versions
activity_logs
```

---

# 📁 Project Structure

```text
customer-data-onboarding-pipeline/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── ...
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── jobs.js
│   │   │
│   │   ├── services/
│   │   │   ├── redis.js
│   │   │   └── database.js
│   │   │
│   │   └── server.js
│   │
│   ├── uploads/
│   ├── .env
│   └── package.json
│
├── data_engine/
│   ├── app/
│   │   ├── main.py
│   │   ├── profiler.py
│   │   ├── validator.py
│   │   ├── transformer.py
│   │   ├── loader.py
│   │   ├── config_loader.py
│   │   ├── queue.py
│   │   ├── worker.py
│   │   ├── job_model.py
│   │   └── ...
│   │
│   ├── configs/
│   │   └── customers/
│   │       ├── acme.yaml
│   │       └── beta.yaml
│   │
│   ├── run_pipeline.py
│   ├── requirements.txt
│   └── .env
│
├── database/
│   └── schema.sql
│
├── sample-data/
│   ├── acme/
│   ├── beta/
│   ├── novamart/
│   └── globalmart/
│
├── docker-compose.yml
│
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Install the following:

* Node.js 18+
* Python 3.9+
* PostgreSQL
* Redis
* Git
* Docker Desktop

---

# 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>

cd customer-data-onboarding-pipeline
```

---

# 2. Start Redis

From the project root:

```bash
docker compose up -d
```

Verify:

```bash
docker ps
```

You should see the Redis container running.

---

# 3. Configure PostgreSQL

Create the database:

```sql
CREATE DATABASE customer_onboarding;
```

Then execute the SQL schema located in:

```text
database/schema.sql
```

The database should contain at least:

```text
customers
onboarding_jobs
```

---

# 4. Configure the Backend

Open a terminal:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create:

```text
backend/.env
```

Add:

```env
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
```

Start the backend:

```bash
npm run dev
```

Expected output:

```text
Redis connected
Backend API running: 3000
```

Test the API:

```http
GET http://localhost:3000/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "backend"
}
```

---

# 5. Start the Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm run dev
```

Open the URL displayed by Vite.

Usually:

```text
http://localhost:5173
```

---

# 6. Start the Python Worker

Open another terminal:

```bash
cd data_engine
```

Create a virtual environment:

### Windows

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### macOS / Linux

```bash
python -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the worker:

```bash
python -m app.worker
```

Expected output:

```text
Worker started...
Waiting for jobs...
```

The worker is now waiting for jobs from Redis.

---

# 🧪 Testing the Complete Pipeline

The repository contains sample customer datasets.

```text
sample-data/
├── acme/
├── beta/
├── novamart/
└── globalmart/
```

For a complete test, use:

```text
sample-data/globalmart/customers.csv
```

The expected flow is:

```text
React
  ↓
POST /jobs
  ↓
Node.js
  ↓
Redis
  ↓
Python Worker
  ↓
Validation
  ↓
Transformation
  ↓
PostgreSQL
```

For the included GlobalMart dataset:

```text
Records received : 20
Records valid    : 19
Records rejected : 1
```

The rejected record intentionally demonstrates data-quality handling.

---

# 🔌 API Endpoints

## Health Check

```http
GET /health
```

Response:

```json
{
  "status": "healthy",
  "service": "backend"
}
```

---

## Create Onboarding Job

```http
POST /jobs
```

Multipart form data:

```text
job_id
customer
file
```

Example response:

```json
{
  "message": "Job queued successfully",
  "job": {
    "job_id": "job-1725638291",
    "customer": "globalmart",
    "file": "..."
  }
}
```

Response status:

```text
202 Accepted
```

---

## Get Job Status

```http
GET /jobs/:job_id
```

Example:

```json
{
  "job_id": "job-1725638291",
  "customer": "globalmart",
  "status": "COMPLETED",
  "records_received": 20,
  "records_valid": 19,
  "records_rejected": 1
}
```

---

# 📊 Example Customer Data

The project includes multiple customers with different schemas.

## Acme

```text
customer_no
full_name
email_id
mobile
joined_on
```

## Beta

```text
id
name
email_address
phone_number
registration_date
```

## NovaMart

```text
client_ref
customer_name
contact_email
contact_number
signup_date
```

## GlobalMart

```text
client_code
customer_full_name
email_address
mobile_number
registration_date
```

All ultimately map to:

```text
customer_id
first_name
last_name
email
phone
created_at
```

This demonstrates how the same pipeline can support heterogeneous customer schemas.

---

# 🧠 Why Node.js + Python?

The architecture deliberately separates API orchestration from data processing.

## Node.js

Responsible for:

* HTTP APIs
* File uploads
* Frontend communication
* Request validation
* Job creation
* Redis communication
* API orchestration

## Python

Responsible for:

* CSV processing
* Pandas
* Data profiling
* Data validation
* Data transformation
* ETL
* Data quality processing

This separation allows each service to focus on the workload it handles best.

---

# 🗃️ Why PostgreSQL?

PostgreSQL provides durable persistent storage.

It stores:

```text
Customers
Onboarding Jobs
Processing Metrics
Job Status
Configurations
Mappings
Audit Logs
```

The architectural distinction is:

```text
Redis
→ Temporary operational state / job queue

PostgreSQL
→ Durable business state
```

---

# 🔐 Environment Variables

Never commit secrets to Git.

Example:

```text
backend/.env
data_engine/.env
```

Typical variables:

```env
DB_PASSWORD=...
DATABASE_URL=...
LLM_API_KEY=...
```

Make sure `.env` files are included in `.gitignore`.

Never commit:

```text
API keys
Database passwords
Access tokens
Production credentials
```

---

# 🛠️ Troubleshooting

## Redis connection failed

Check whether Redis is running:

```bash
docker ps
```

If necessary:

```bash
docker compose up -d
```

---

## PostgreSQL connection failed

Verify:

```text
Database name
PostgreSQL port
Username
Password
PostgreSQL service
```

Default PostgreSQL port:

```text
5432
```

---

## Python Worker Is Not Processing Jobs

Verify:

1. Redis is running
2. Node.js backend is running
3. Python worker is running
4. The job was successfully queued

The worker should display:

```text
Worker started...
Waiting for jobs...
```

---

## Duplicate Job ID

Every onboarding job requires a unique `job_id`.

For testing, create a new job ID for every upload.

The frontend automatically generates job IDs using the current timestamp.

---

# 📈 Production Evolution

The current project is intentionally simple enough to understand locally while providing a foundation for a production-grade architecture.

## Current Architecture

```text
React
  ↓
Node.js
  ↓
Redis
  ↓
Python Worker
  ↓
PostgreSQL
```

## Future Architecture

```text
                         ┌───────────────┐
                         │ React Console │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │ API Gateway   │
                         └───────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              Customer API   Mapping API   Job API
                    │            │            │
                    └────────────┼────────────┘
                                 ▼
                         ┌───────────────┐
                         │ Redis Streams │
                         └───────┬───────┘
                                 │
                  ┌──────────────┼──────────────┐
                  ▼              ▼              ▼
             Worker #1      Worker #2      Worker #3
                  │              │              │
                  └──────────────┼──────────────┘
                                 ▼
                         ┌───────────────┐
                         │ PostgreSQL    │
                         └───────────────┘
```

---

# 🗺️ Roadmap

## Phase 1 — Core Pipeline

* [x] React frontend
* [x] Node.js API
* [x] CSV upload
* [x] Redis queue
* [x] Python worker
* [x] CSV validation
* [x] Data transformation
* [x] PostgreSQL loading
* [x] Job tracking

## Phase 2 — Onboarding Platform

* [ ] Customer management
* [ ] Data profiling dashboard
* [ ] Rejected-record viewer
* [ ] Schema mapping UI
* [ ] Configuration management
* [ ] Mapping version history
* [ ] Rollback support
* [ ] Activity logs

## Phase 3 — AI Onboarding

* [ ] Automatic schema discovery
* [ ] LLM-powered mapping
* [ ] Mapping confidence scores
* [ ] Mapping explanations
* [ ] Human approval workflow
* [ ] AI mapping history
* [ ] Automatic remapping suggestions

## Phase 4 — Production Hardening

* [ ] Redis Streams / durable queue
* [ ] Retry mechanism
* [ ] Dead-letter queue
* [ ] Idempotent job processing
* [ ] Chunked CSV processing
* [ ] Object storage
* [ ] SFTP ingestion
* [ ] Database connectors
* [ ] API-based ingestion
* [ ] Authentication
* [ ] RBAC
* [ ] Observability
* [ ] Metrics and alerting
* [ ] Dockerized deployment
* [ ] Kubernetes deployment

---

# 💡 Engineering Principles

## Configuration Over Custom Code

Customer-specific behavior should be represented through configuration wherever possible.

Instead of:

```text
Customer A → custom Python script
Customer B → custom Python script
Customer C → custom Python script
```

the goal is:

```text
Customer A ─┐
Customer B ─┤
Customer C ─┼──→ Generic Onboarding Engine
Customer D ─┘
                    ↑
              Configuration
```

---

## AI Assists — Humans Approve

The AI accelerates schema understanding but does not silently control production mappings.

```text
AI
 ↓
Recommendation
 ↓
Human Review
 ↓
Approval
 ↓
Execution
```

---

## APIs Should Remain Responsive

Long-running data processing should happen asynchronously.

```text
HTTP Request
     ↓
Create Job
     ↓
Queue
     ↓
Return 202
     ↓
Background Processing
```

---

## Invalid Data Should Be Isolated

A single malformed record should not unnecessarily destroy an entire customer ingestion job.

---

## Durable State Belongs in PostgreSQL

Redis is used for operational messaging.

PostgreSQL remains the source of truth for persistent business state.

---

## Build for Repetition

The goal is not to solve onboarding for one customer.

The goal is to make onboarding the **next 100 customers easier**.

---

# 💼 What This Project Demonstrates

This project demonstrates practical engineering concepts across several areas.

## Data Engineering

* ETL pipelines
* Schema normalization
* Data validation
* Data quality handling
* Data profiling
* Pandas
* PostgreSQL

## Backend Engineering

* REST APIs
* File uploads
* Async processing
* Job orchestration
* Redis queues
* Database persistence

## AI Engineering

* LLM-based schema understanding
* Structured AI output
* Confidence-based recommendations
* Human-in-the-loop workflows
* AI-assisted configuration generation

## Distributed Systems

* Service separation
* Message queues
* Worker architecture
* Asynchronous execution
* Horizontal scalability

## Forward Deployed Engineering

The project demonstrates an important FDE mindset:

> **Solve the repeated customer problem once, then make customer-specific behavior configurable.**

Instead of repeatedly creating bespoke solutions:

```text
Customer A → Custom Solution
Customer B → Custom Solution
Customer C → Custom Solution
Customer D → Custom Solution
```

the platform moves toward:

```text
                    ┌──────────────────┐
Customer A ────────►│                  │
Customer B ────────►│    Generic       │
Customer C ────────►│    Onboarding    │
Customer D ────────►│    Platform      │
                    │                  │
                    └──────────────────┘
                             ▲
                             │
                       Configuration
```

---

# 🎬 Recommended Demo Flow

For a portfolio demonstration, use the following sequence:

```text
1. Open Dashboard
        ↓
2. Create Customer
        ↓
3. Upload Sample CSV
        ↓
4. Profile Source Schema
        ↓
5. Generate AI Mapping
        ↓
6. Review Mapping
        ↓
7. Approve Mapping
        ↓
8. Upload Full Dataset
        ↓
9. Job Enters Redis
        ↓
10. Python Worker Processes Job
        ↓
11. Validate Records
        ↓
12. Transform Data
        ↓
13. Load PostgreSQL
        ↓
14. View Job Metrics
        ↓
15. Review Rejected Records
```

This demonstrates the complete customer onboarding lifecycle.

---

# 🔮 Future Improvements

Potential future enhancements include:

### Ingestion

* SFTP ingestion
* REST API ingestion
* Database connectors
* Cloud storage ingestion
* Streaming ingestion

### Data Processing

* Large-file chunking
* Parallel processing
* Data type inference
* Duplicate detection
* Advanced data-quality rules

### AI

* Semantic schema matching
* Automatic transformation generation
* Mapping confidence scoring
* AI-generated validation rules
* Automatic anomaly detection
* Schema drift detection

### Reliability

* Redis Streams
* Retry policies
* Dead-letter queues
* Idempotent processing
* Distributed locks
* Job cancellation

### Enterprise

* Authentication
* Role-based access control
* Multi-tenancy
* Audit logging
* Data encryption
* Observability
* Metrics
* Alerts

### Infrastructure

* Dockerized services
* CI/CD
* Kubernetes
* Cloud object storage
* Horizontal worker scaling

---

# 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

# 👤 Author

**Deo Prakash**

Built as a portfolio project demonstrating:

* Forward Deployed Engineering
* Data Engineering
* Backend Engineering
* AI / LLM Engineering
* Distributed Systems
* Customer Data Onboarding
* ETL Automation

---

## ⭐ Final Thought

> **From bespoke customer scripts to a reusable AI-powered onboarding platform.**

The objective is not simply to move CSV data from one database to another.

The objective is to build a system that **learns the customer's schema, assists engineers with mapping, validates data, processes workloads asynchronously, and creates a repeatable onboarding experience.**

**Build once. Configure per customer. Scale onboarding. 🚀**
