# Proposal App Frontend

This is a [Next.js](https://nextjs.org) project for the Proposal Management System frontend, bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Architecture

This frontend application connects to a Laravel backend API for all data operations. The system uses:
- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Laravel API (proposal-backend)
- **Authentication**: Laravel Sanctum
- **Database**: MySQL (via Laravel backend)

## Prerequisites

Before running the frontend, ensure the Laravel backend is running:
1. Navigate to `../proposal-backend`
2. Start the Laravel development server on `http://127.0.0.1:8001`

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Copy the example environment file
cp .env.example .env.local

# Update NEXT_PUBLIC_API_URL to point to your Laravel backend
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

Run the test suite:
```bash
npm test
# or for watch mode
npm run test:watch
# or for coverage
npm run test:coverage
```

## API Integration

All data operations are handled through the Laravel backend API. The frontend uses:
- `/api/auth/*` - Authentication endpoints
- `/api/clients/*` - Client management
- `/api/projects/*` - Project management  
- `/api/proposals/*` - Proposal management
- `/api/main-modules/*` - Module and feature data

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
