# Deployment Guide

This guide explains how to deploy the **Sprout DM Agent Dashboard** with SQLite, Authentication, and Public Sharing features.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop).

## Quick Start (Local Deployment)

1.  **Clone the repository** (if not already done).
2.  **Navigate to the project root** (where `docker-compose.yml` is located).
3.  **Run the application**:
    ```bash
    docker-compose up --build -d
    ```
4.  **Access the Dashboard**:
    - Open [http://localhost:3000](http://localhost:3000) in your browser.
    - Since the database is new, you will be redirected to `/login`.

## First-Time Setup (Admin Account)

1.  **Register the Admin**:
    - Go to [http://localhost:3000/register](http://localhost:3000/register).
    - Sign up with your details.
    - **IMPORTANT**: The **first user** registered will automatically be assigned the **`ADMIN`** role and will be **`APPROVED`** immediately.

2.  **Invite Team Members**:
    - Ask your team members to register at `/register`.
    - They will see a "Pending Approval" message after signing up.

3.  **Approve Users**:
    - Log in as the Admin.
    - Navigate to `/admin` (or click "Admin Panel" in the dashboard if linked).
    - You will see a list of pending users. Click **Approve** to grant them access.

## Features Usage

### Public Sharing
1.  Open a Dashboard.
2.  Click the **Share** button (if implemented in UI) or use the API manually for now.
    - *Note: API Endpoint is `POST /api/dashboards/:id/share`*
3.  Copy the generated **Public Link**.
4.  Send this link to stakeholders. They can view the dashboard without logging in.

### PDF Export
1.  Open a Dashboard.
2.  Click **Export PDF**.
3.  The file `dashboard-export.pdf` will download.

## Troubleshooting

- **Database Persistence**:
    - The SQLite database is stored in `./dm-agent-dashboard/sprout.db`.
    - This file is mounted into the container, so your data persists even if you restart Docker.
    - **Backing up**: Simply copy `sprout.db` to a safe location.

- **Rebuilding**:
    - If you change code, you must rebuild:
      ```bash
      docker-compose up --build -d
      ```
