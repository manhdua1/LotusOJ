# LotusOJ

A full-stack Online Judge platform for competitive programming practice and evaluation. LotusOJ provides automated code judging, problem management, submission tracking, and AI-powered complexity analysis.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Quick Start with Docker Compose](#quick-start-with-docker-compose)
  - [Running Locally (Development)](#running-locally-development)
- [Environment Variables](#environment-variables)
- [Supported Languages](#supported-languages)
- [Verdict Types](#verdict-types)
- [User Roles](#user-roles)
- [Default Accounts](#default-accounts)
- [Project Structure](#project-structure)

---

## Overview

LotusOJ is a self-hosted online judge system inspired by platforms such as Codeforces and VNOJ. Users can browse a problem set, submit code solutions in multiple programming languages, and receive real-time verdicts. Problem setters can create and manage problems with rich Markdown descriptions and test cases via an admin panel. A Google Gemini AI integration provides automatic time and space complexity analysis for accepted submissions.

---

## Tech Stack

### Backend

| Component        | Technology                              |
|------------------|-----------------------------------------|
| Framework        | Spring Boot 4.1.0 (Java 26)            |
| ORM              | Spring Data JPA / Hibernate             |
| Database         | MySQL                                   |
| Cache            | Redis                                   |
| Message Broker   | RabbitMQ (AMQP)                         |
| Security         | Spring Security + JWT (jjwt 0.12.x)    |
| Code Mapping     | MapStruct 1.6.3                         |
| Code Generation  | Lombok                                  |
| WebSocket        | Spring WebSocket (real-time verdicts)   |
| AI Integration   | Google Gemini API                       |

### Frontend

| Component        | Technology                              |
|------------------|-----------------------------------------|
| Framework        | React 19 + TypeScript                   |
| Build Tool       | Vite 8                                  |
| Rich Text Editor | Tiptap (WYSIWYG / Markdown / Preview)   |
| Markdown Parser  | marked                                  |
| Math Rendering   | KaTeX                                   |
| Code Editor      | Monaco Editor                           |
| Sanitization     | DOMPurify                               |
| Styling          | Vanilla CSS                             |

### Infrastructure

| Component        | Technology                              |
|------------------|-----------------------------------------|
| Judge Sandbox    | Docker (container-per-submission)       |
| Containerization | Docker Compose                          |
| Frontend Serving | Nginx                                   |

---

## Architecture

```
Browser (React SPA)
       |
       | HTTP / WebSocket
       v
Spring Boot REST API (port 8080)
  |          |           |
  |        Redis        MySQL
  |       (cache)      (data)
  |
RabbitMQ (submission queue)
  |
JudgeConsumer
  |
DockerExecutor
  |
Docker containers (gcc, openjdk, python, dotnet)
```

When a user submits code, the backend places the submission on a RabbitMQ queue. A `JudgeConsumer` picks up the job and delegates to `DockerExecutor`, which:

1. Writes source code into a shared Docker volume.
2. Spawns a language-specific container to compile (if necessary) and execute the code against each test case.
3. Enforces time and memory limits, captures stdout, and compares against expected output.
4. Updates the submission verdict in the database and broadcasts the result via WebSocket.

---

## Features

- **Problem Set** - Browse, search, and filter problems by tags and difficulty.
- **Rich Problem Descriptions** - Problems support full Markdown, code blocks, tables, and KaTeX math formulas.
- **Tiptap Editor** - Admin panel uses a WYSIWYG / raw Markdown / preview editor for writing problem statements.
- **Code Submission** - Submit solutions using Monaco Editor with syntax highlighting.
- **Real-time Verdicts** - WebSocket updates deliver judge results without page reload.
- **Sandboxed Execution** - Each submission runs in an isolated Docker container with no network access, CPU time limits, and memory limits.
- **Multi-language Support** - C, C++, Java, Python, C#.
- **Submission History** - View all personal or global submissions, filterable by problem and verdict.
- **AI Complexity Analysis** - After an accepted submission, users can request Gemini-powered time and space complexity analysis.
- **Admin Panel** - Create, edit, and delete problems and test cases with role-based access control.
- **JWT Authentication** - Stateless auth with access and refresh tokens.
- **Dark / Light Theme** - System-level theme toggle with persisted preference.

---

## Prerequisites

- Docker 24+ and Docker Compose v2+
- Docker images pulled locally (the judge needs these at runtime):

```
docker pull gcc:13.2
docker pull openjdk:17-slim
docker pull python:3.11-slim
docker pull mcr.microsoft.com/dotnet/sdk:8.0
```

For local development without Docker:

- Java 26 JDK
- Node.js 20+ and npm
- MySQL 8+
- Redis 7+
- RabbitMQ 3+

---

## Getting Started

### Quick Start with Docker Compose

```bash
# 1. Clone the repository
git clone https://github.com/manhdua1/LotusOJ.git
cd LotusOJ

# 2. Copy the example environment file and fill in secrets
cp .env.example .env
# Edit .env to set GEMINI_API_KEY and a strong JWT_SIGNER_KEY

# 3. Pull required judge Docker images
docker pull gcc:13.2
docker pull openjdk:17-slim
docker pull python:3.11-slim
docker pull mcr.microsoft.com/dotnet/sdk:8.0

# 4. Start all services
docker compose up --build -d

# 5. Access the application
# Frontend:             http://localhost        (port 80)
# Backend API:          http://localhost:8080
# RabbitMQ Management:  http://localhost:15672
```

The `DataInitializer` component automatically seeds sample users, problems, and test cases on first startup.

### Running Locally (Development)

**Backend:**

```bash
# Ensure MySQL, Redis, and RabbitMQ are running locally
# Configure src/main/resources/application.yaml or set environment variables

./mvnw spring-boot:run
# API available at http://localhost:8080
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
# Dev server available at http://localhost:5173
```

---

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed.

| Variable              | Default             | Description                                      |
|-----------------------|---------------------|--------------------------------------------------|
| FRONTEND_PORT         | 80                  | Host port for the Nginx frontend                 |
| BACKEND_PORT          | 8080                | Host port for the Spring Boot backend            |
| MYSQL_PORT            | 3306                | Host port for MySQL                              |
| REDIS_PORT            | 6379                | Host port for Redis                              |
| RABBITMQ_PORT         | 5672                | Host port for RabbitMQ AMQP                      |
| RABBITMQ_MGMT_PORT    | 15672               | Host port for RabbitMQ management UI             |
| MYSQL_ROOT_PASSWORD   | root                | MySQL root password                              |
| MYSQL_DATABASE        | oj_db               | MySQL database name                              |
| RABBITMQ_USER         | guest               | RabbitMQ username                                |
| RABBITMQ_PASS         | guest               | RabbitMQ password                                |
| JWT_SIGNER_KEY        | (default key)       | HMAC-SHA key for signing JWT tokens              |
| GEMINI_API_KEY        | (empty)             | Google Gemini API key for AI complexity analysis |
| GEMINI_MODEL          | gemini-2.5-flash    | Gemini model name                                |

If `GEMINI_API_KEY` is left empty, the AI complexity analysis feature is disabled gracefully.

---

## Supported Languages

| Language | Version      | Docker Image                          |
|----------|--------------|---------------------------------------|
| C        | GCC 13.2     | gcc:13.2                              |
| C++      | GCC 13.2     | gcc:13.2                              |
| Java     | OpenJDK 17   | openjdk:17-slim                       |
| Python   | Python 3.11  | python:3.11-slim                      |
| C#       | .NET SDK 8.0 | mcr.microsoft.com/dotnet/sdk:8.0      |

---

## Verdict Types

| Code | Full Name              | Description                                    |
|------|------------------------|------------------------------------------------|
| AC   | Accepted               | All test cases passed                          |
| WA   | Wrong Answer           | Output did not match the expected answer       |
| TLE  | Time Limit Exceeded    | Execution time exceeded the problem time limit |
| MLE  | Memory Limit Exceeded  | Memory usage exceeded the problem memory limit |
| CE   | Compilation Error      | Source code failed to compile                  |
| RTE  | Runtime Error          | Program crashed during execution               |
| OLE  | Output Limit Exceeded  | Output exceeded 256 KB                         |
| IE   | Internal Error         | Judge-side error (infrastructure issue)        |

---

## User Roles

| Role              | Permissions                                                         |
|-------------------|---------------------------------------------------------------------|
| USER              | Browse problems, submit code, view submissions, request AI analysis |
| PROBLEM_SETTER    | All USER permissions + access to admin panel, manage problems       |
| CONTEST_MANAGER   | All USER permissions + contest management (reserved for future use) |
| ADMIN             | Full access to all features and admin panel                         |

---

## Default Accounts

These accounts are created automatically by `DataInitializer` on first startup.
Change passwords before deploying to production.

| Username          | Email                | Password     | Role            |
|-------------------|----------------------|--------------|-----------------|
| admin             | admin@lotusoj.com    | Password123@ | ADMIN           |
| problem_setter    | setter@lotusoj.com   | Password123@ | PROBLEM_SETTER  |
| contest_manager   | manager@lotusoj.com  | Password123@ | CONTEST_MANAGER |
| alice             | alice@lotusoj.com    | Password123@ | USER            |
| bob               | bob@lotusoj.com      | Password123@ | USER            |

---

## Project Structure

```
LotusOJ/
|-- src/main/java/io/github/manhdua1/lotusoj/
|   |-- config/         Spring configuration, DataInitializer, RabbitMQ, security
|   |-- controller/     REST controllers (Auth, Problem, Submission, TestCase, AI)
|   |-- dto/            Request and Response DTOs
|   |-- entity/         JPA entities (User, Problem, Submission, TestCase, Tag)
|   |-- exception/      Global exception handling
|   |-- judge/          DockerExecutor, JudgeService, JudgeConsumer
|   |-- mapper/         MapStruct mappers
|   |-- repository/     Spring Data JPA repositories
|   |-- security/       JWT filter, authentication entry points
|   |-- service/        Business logic (auth, problem, submission, AI)
|   `-- util/           Utility classes
|-- src/main/resources/
|   `-- application.yaml
|-- frontend/
|   |-- src/
|   |   |-- components/ React UI components
|   |   |-- services/   API service clients
|   |   |-- types/      TypeScript type definitions
|   |   |-- context/    React context providers (theme)
|   |   `-- constants/  Editor templates and static constants
|   `-- package.json
|-- Dockerfile          Multi-stage build for Spring Boot backend
|-- docker-compose.yml  Full stack orchestration
`-- .env.example        Environment variable template
```
