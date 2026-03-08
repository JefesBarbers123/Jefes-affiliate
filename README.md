This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

From the `web` folder:

```bash
npm run build
npx vercel
npx vercel --prod
```

Set these environment variables in Vercel project settings:

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_BARBERS_TABLE`
- `AIRTABLE_APPOINTMENTS_TABLE`
- `AIRTABLE_AVAILABILITY_TABLE`
- `AIRTABLE_WITHDRAWALS_TABLE`
- `AIRTABLE_EMAIL_LOGS_TABLE`
- `RESEND_API_KEY`
- `APP_URL` (set to your deployed URL)
- `AUTH_SECRET`
- `EMAIL_FROM_BOOKINGS` (optional once domain is verified)
- `EMAIL_FROM_UPDATES` (optional once domain is verified)
- `EMAIL_FROM_REMINDERS` (optional once domain is verified)
