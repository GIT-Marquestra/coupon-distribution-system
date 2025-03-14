# Coupon Distribution System

## Overview
This is a live web application for distributing coupons to guest users in a round-robin manner, with mechanisms to prevent abuse through repeated claims via page refreshes. The system ensures fair distribution while enforcing cooldown periods.

## Features
- **Round-Robin Coupon Assignment**: Ensures even distribution of coupons.
- **Guest Access**: Users can claim coupons without requiring login or account creation.
- **Abuse Prevention**:
  - IP Tracking: Restricts multiple claims from the same IP within a specified cooldown period.
  - Cookie Tracking: Prevents repeated claims from the same browser session.
- **User Feedback**: Provides real-time messages on successful claims or cooldown status.
- **Deployment**: Accessible via a public URL.

## Tech Stack
- **Next.js** for frontend and backend routes.
- **Prisma ORM** for database management.
- **PostgreSQL** as the database.
- **UUID & Cookies API** for user tracking.
- **Vercel** for deployment.

## API Endpoints
### `POST /api/claim`
**Description**: Allows a guest user to claim a coupon.

#### Request Headers:
- `x-forwarded-for`: User's IP address (used for abuse prevention).

#### Response:
- **200 OK**: Coupon successfully claimed.
- **202 Accepted**: User must wait before claiming another coupon.
- **203 No Content**: No coupons available.
- **208 Already Reported**: Duplicate IP detected.
- **500 Internal Server Error**: System failure.

## Installation & Setup
### Prerequisites
- Node.js
- PostgreSQL

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/coupon-distribution.git
   cd coupon-distribution
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the database:
   ```bash
   npx prisma migrate dev
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Abuse Prevention Mechanism
1. **IP Tracking**: Restricts multiple claims from the same IP for `COOLDOWN_PERIOD`.
2. **Cookie-based User Identification**: Prevents multiple claims from the same browser session.
3. **Round-Robin Allocation**: Distributes coupons sequentially.

## Deployment
To deploy on Vercel:
```bash
vercel
```

## Live URL
[\[Your Deployed Link Here\]](https://coupon-distribution-system-alpha.vercel.app/)

## Author
Abhishek Verma

