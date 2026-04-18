# EcoPlate

EcoPlate is a simple, production-ready Next.js web app for restaurant food donation, charity pickup requests, advertisement publishing, and AI-based donation guidance.

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Gemini API

## Simple Project Structure

```text
src/
  app/
  components/
  lib/
  services/
  types/
  styles/
```

## Features

- Role-based authentication for `restaurant`, `charity`, and `admin`
- Landing page with public published ads
- Restaurant donation creation and management
- Charity donation request workflow
- Restaurant advertisement upload
- Admin dashboard with stats and ad controls
- Profile view and edit page
- Gemini-powered EcoPlate chatbot

## Setup Steps

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file:

```bash
cp .env.local.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

3. Add your Firebase and Gemini values to `.env.local`.

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
```

## Firebase Setup Instructions

1. Create a Firebase project.
2. Enable Authentication and turn on Email/Password sign-in.
3. Create a Firestore database in production mode.
4. Create a Storage bucket.
5. Copy your Firebase web app config values into `.env.local`.
6. Deploy the included `firestore.rules` and `storage.rules`.
7. Register a restaurant and a charity account from the UI.
8. Create an admin account by registering once, then manually changing that user document role in Firestore from `restaurant` or `charity` to `admin`.

## Firestore Collections

- `users`
- `donations`
- `requests`
- `ads`

## Data Model Summary

### `users`

- `id`
- `name`
- `email`
- `phone`
- `address`
- `role`
- `createdAt`

### `donations`

- `restaurantId`
- `foodName`
- `quantity`
- `description`
- `pickupLocation`
- `pickupTime`
- `expiryDate`
- `status`
- `createdAt`

### `requests`

- `donationId`
- `charityId`
- `message`
- `status`
- `createdAt`

### `ads`

- `title`
- `description`
- `imageUrl`
- `restaurantId`
- `contactNumber`
- `paymentStatus`
- `status`
- `createdAt`

## User Role Flow Summary

### Restaurant

- Register or log in
- Open dashboard
- Create donation posts
- Review and manage charity requests
- Create advertisements
- View ad payment and publishing status

### Charity

- Register or log in
- Open dashboard
- Browse available donations
- Send donation requests
- Track request status
- Use the AI support page

### Admin

- Log in with a user whose Firestore role is set to `admin`
- Open `/admin`
- View totals for users, donations, requests, and ads
- Open `/admin/ads`
- Approve or reject ads
- Mark ads as paid
- Publish approved paid ads

## Build Commands

```bash
npm run typecheck
npm run build
```

## Notes

- The app keeps the Firestore service layer intentionally simple and readable.
- Dates are stored as ISO strings to keep the project beginner-friendly.
- Public ads are only shown when `paymentStatus = paid` and `status = published`.
- Chat history is session-only in the browser for simplicity.
