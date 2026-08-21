# Kerdion User Management & Onboarding Roadmap

## Vision Statement
To upgrade the Kerdion platform's user management by collecting richer user data (name, occupation), securing accounts via email verification (using Resend), and empowering users with a dedicated self-service Account Dashboard.

---

## Phase 1: Database & Backend Foundation
*Goal: Expand the `User` schema and create the necessary API endpoints to support the new data and verification flows.*

- [x] **Task 1.1: Database Schema Updates (SQLAlchemy)**
  - Update `app/models/user.py` to include new columns:
    - `first_name` (String, nullable=False)
    - `last_name` (String, nullable=False)
    - `occupation` (String, nullable=True)
    - `is_verified` (Boolean, default=False)
    - `verification_token` (String, nullable=True, unique=True)
- [x] **Task 1.2: Alembic Migrations**
  - Generate a new Alembic migration script (`alembic revision --autogenerate -m "add user profile and verification fields"`).
  - Apply the migration to the PostgreSQL database (`alembic upgrade head`).
- [x] **Task 1.3: Update Pydantic Schemas**
  - Update `UserCreate` schema in `app/schemas/user.py` to require `first_name`, `last_name`, and accept optional `occupation`.
  - Update `UserResponse` schema to expose these new fields and `is_verified`.
  - Create `UserUpdate` schema for editing profiles.
- [x] **Task 1.4: Refactor Auth Endpoints**
  - Modify `POST /api/v1/auth/register` to accept the new `UserCreate` schema.
  - Modify the login endpoint `POST /api/v1/auth/login` to block access (return `403 Forbidden`) if `user.is_verified` is False.

## Phase 2: Email Verification System (Resend Integration)
*Goal: Secure the platform by ensuring all registered emails are valid and owned by the user.*

- [x] **Task 2.1: Resend Setup & Configuration**
  - Create an account on [Resend.com](https://resend.com), verify a domain (if available) or use the testing environment.
  - Add `RESEND_API_KEY` to the backend `.env` file.
  - Install the Resend Python SDK (`poetry add resend`).
- [x] **Task 2.2: Email Dispatch Service**
  - Create `app/services/email_service.py`.
  - Write a function `send_verification_email(email, token, first_name)` that uses Resend to send a beautifully styled HTML email containing a verification link (e.g., `http://localhost:3000/verify-email?token=xyz`).
- [x] **Task 2.3: Triggering the Email**
  - Update the `POST /api/v1/auth/register` endpoint: upon successful user creation, generate a secure random `verification_token`, save it to the user record, and call `send_verification_email` in the background (using FastAPI `BackgroundTasks`).
- [x] **Task 2.4: Verification Endpoint**
  - Create a new endpoint `GET /api/v1/auth/verify-email?token={token}`.
  - Logic: Find the user by token, set `is_verified = True`, set `verification_token = Null`, and return a success message.

## Phase 3: User Dashboard & Account Management Endpoints
*Goal: Provide the backend logic for users to manage their own data.*

- [x] **Task 3.1: Get Current User Details**
  - Create `GET /api/v1/users/me` (requires JWT token) to return the full `UserResponse` of the currently logged-in user.
- [x] **Task 3.2: Update User Profile**
  - Create `PATCH /api/v1/users/me` to allow users to update their `first_name`, `last_name`, `occupation`, and email. *(Note: If email is changed, `is_verified` should be set to False and a new verification email dispatched).*
- [x] **Task 3.3: Delete Account**
  - Create `DELETE /api/v1/users/me` to permanently delete the user's account and cascade delete any associated user-specific data.

## Phase 4: Frontend Implementation (Next.js)
*Goal: Build the UI to interact with the new backend features, adhering to the premium Glassmorphism design system.*

- [x] **Task 4.1: Update Registration Form (`/signup`)**
  - Add input fields for First Name, Last Name, and Occupation.
  - Update the API client payload to send these fields.
  - On successful registration, redirect to a new `/verify-pending` page instructing the user to check their email.
- [x] **Task 4.2: Email Verification Page (`/verify-email`)**
  - Create a new page route that reads the `?token=` query parameter from the URL.
  - Automatically call the backend verification endpoint.
  - Show a success animation/glassmorphism card with a button to "Proceed to Login".
- [x] **Task 4.3: Account Dashboard Layout (`/account`)**
  - Create a new protected route accessible from the main navigation (e.g., clicking a profile icon).
  - Design the dashboard using the premium dark-slate aesthetic.
- [x] **Task 4.4: Edit Profile Forms**
  - Build a sleek form within the dashboard pre-populated with the user's current data.
  - Add a "Save Changes" button that calls the `PATCH` endpoint, complete with loading spinners and success toast notifications.
- [x] **Task 4.5: Danger Zone (Delete Account)**
  - Create a designated "Danger Zone" section at the bottom of the dashboard.
  - Add a red "Delete Account" button that triggers a confirmation modal ("Are you absolutely sure? Type your password to confirm").
  - On success, clear the local JWT cookie and redirect to the landing page.
