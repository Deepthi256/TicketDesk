# TicketDesk - Local Development Specification

Version: 1.0

Project: TicketDesk

Status: Phase 1 - Local Application Development

---

# Project Goal

Build a simple IT Support Ticket Tracking application that runs completely on a local machine.

The objective of this phase is to create a fully functional application before integrating Docker and AWS services.

The application should support:

- Ticket Management
- Comments
- Dashboard
- Local Database
- REST APIs
- React Frontend

No AWS integration is required in this phase.

---

# Technology Stack

## Frontend

- React 19
- React Router
- TypeScript
- Vite
- Axios
- React Query
- React Hook Form
- Tailwind CSS
- shadcn/ui
- Lucide Icons

---

## Backend

- Python 3.11
- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- Uvicorn

---

## Database

Sqlite

Run locally using Docker or a local Sqlite installation.

---

# Application Modules

The application consists of four primary modules.

## 1. Dashboard

Displays overall ticket statistics.

Cards

- Total Tickets
- Open Tickets
- In Progress Tickets
- Resolved Tickets
- Closed Tickets

Priority Summary

- High
- Medium
- Low

Recent Tickets Table

Maximum 10 latest tickets.

---

## 2. Ticket Management

Users can perform complete ticket management.

### Create Ticket

Fields

- Title
- Description
- Category
- Priority

Default Status

OPEN

---

### View Tickets

Display all tickets.

Support filters

- Status
- Category
- Priority

Support Search

- Search by Title

Support Sorting

Newest First

Oldest First

---

### View Ticket Details

Display

- Ticket Information
- Status
- Comments
- Attachment Information

---

### Update Ticket

Editable

- Title
- Description
- Category
- Priority

---

### Update Status

Allowed workflow

OPEN

↓

IN_PROGRESS

↓

RESOLVED

↓

CLOSED

Status cannot skip intermediate states.

---

# 3. Comments

Each ticket supports multiple comments.

Fields

- Comment
- Created By
- Created At

Users can

- Add Comment
- View Comments

Deleting comments is not required.

---

# 4. Attachments

Each ticket supports one attachment.

During local development

Store uploaded files locally.

Folder

/uploads

Supported Types

- PNG
- JPG
- JPEG
- PDF

Maximum Size

10 MB

The upload implementation should be abstracted so it can later be replaced by Amazon S3.

---

# Database Design

## Tickets

| Column | Type |
|----------|------|
| id | UUID |
| title | VARCHAR(255) |
| description | TEXT |
| category | VARCHAR(100) |
| priority | ENUM |
| status | ENUM |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

## Comments

| Column | Type |
|----------|------|
| id | UUID |
| ticket_id | UUID |
| comment | TEXT |
| created_by | VARCHAR(100) |
| created_at | TIMESTAMP |

Relationship

Many Comments → One Ticket

---

## Attachments

| Column | Type |
|----------|------|
| id | UUID |
| ticket_id | UUID |
| file_name | VARCHAR |
| file_path | VARCHAR |
| uploaded_at | TIMESTAMP |

Relationship

One Attachment → One Ticket

---

# Backend Folder Structure

backend/

app/

    api/

        tickets.py

        comments.py

        dashboard.py

        health.py

        attachments.py

    database/

        database.py

    models/

        ticket.py

        comment.py

        attachment.py

    schemas/

        ticket.py

        comment.py

        attachment.py

    services/

        ticket_service.py

        comment_service.py

        attachment_service.py

    config.py

    main.py

requirements.txt

---

# Frontend Folder Structure

frontend/

src/

    components/

    pages/

        Dashboard/

        Tickets/

        TicketDetails/

        CreateTicket/

    services/

    hooks/

    layouts/

    types/

    App.tsx

---

# REST APIs

## Health

GET /health

Returns

```json
{
    "status":"healthy"
}
```

---

## Dashboard

GET /api/dashboard

---

## Tickets

POST /api/tickets

GET /api/tickets

GET /api/tickets/{id}

PUT /api/tickets/{id}

PATCH /api/tickets/{id}/status

---

## Comments

POST /api/tickets/{id}/comments

GET /api/tickets/{id}/comments

---

## Attachments

POST /api/tickets/{id}/attachment

GET /api/tickets/{id}/attachment

---

# Request Models

## Create Ticket

```json
{
    "title":"",
    "description":"",
    "category":"",
    "priority":"HIGH"
}
```

---

## Update Status

```json
{
    "status":"IN_PROGRESS"
}
```

---

## Create Comment

```json
{
    "comment":"",
    "createdBy":"Admin"
}
```

---

# User Interface

## Sidebar

- Dashboard
- Tickets
- Create Ticket

---

## Dashboard Page

Display

- Summary Cards
- Priority Chart
- Recent Tickets

---

## Ticket List

Display

- Search
- Filters
- Table

Actions

- View
- Edit

---

## Create Ticket Page

Fields

- Title
- Description
- Category
- Priority
- Attachment

Button

Create Ticket

---

## Ticket Details

Display

- Ticket Information
- Attachment
- Comments
- Status

Actions

- Update Ticket
- Update Status
- Add Comment

---

# Validation Rules

Title

- Required
- Maximum 255 characters

Description

- Required

Priority

Allowed Values

- HIGH
- MEDIUM
- LOW

Status

Allowed Values

- OPEN
- IN_PROGRESS
- RESOLVED
- CLOSED

Category

Required

Attachment

Maximum 10 MB

Supported

- PNG
- JPG
- JPEG
- PDF

---

# Error Handling

Return proper HTTP status codes.

400

Validation Error

404

Resource Not Found

500

Internal Server Error

---

# Logging

Log

- API Requests
- Database Errors
- Upload Errors

Use Python logging module.

---

# Testing

Verify

- Ticket CRUD
- Status Updates
- Comments
- Dashboard
- Attachments
- Health Endpoint

---

# Out of Scope (Phase 1)

Do NOT implement the following yet.

- Docker
- ECS
- Terraform
- AWS Lambda
- Amazon S3
- CloudFront
- Secrets Manager
- Parameter Store
- CloudWatch
- GitHub Actions
- CI/CD Pipeline
- IAM
- ECS Health Checks
- Thumbnail Generation

These will be implemented during Phase 2 (Cloud Deployment).

---

# Phase 1 Success Criteria

The application is complete when:

- Backend APIs are fully functional.
- React frontend consumes all APIs.
- PostgreSQL stores all application data.
- Ticket CRUD works correctly.
- Status workflow is enforced.
- Comments work correctly.
- Local file upload works.
- Dashboard displays correct statistics.
- Health endpoint returns success.
- Application runs locally using:

Backend

uvicorn app.main:app --reload

Frontend

npm run dev

Database

PostgreSQL