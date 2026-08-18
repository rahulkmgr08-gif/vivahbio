# VivahBio — Actual Product MVP

## Included
- Polished landing page
- Template library with 20 built-in designs
- Template category filters
- Hindi / English UI toggle
- Biodata maker with live preview
- Photo upload
- PDF via browser print / Save as PDF
- JPG download
- Premium checkout placeholder (₹19)
- Admin dashboard
- Local settings/download counters
- Responsive mobile design

## Run locally
Open `index.html` in Chrome.

## Production work still required
- Real authentication
- Database (PostgreSQL/Supabase)
- Server-side PDF/JPG generation
- Cloud image storage
- Razorpay server-side order creation + signature verification
- Real admin CRUD for templates
- User accounts and purchase history
- Production deployment/domain/analytics

Never place Razorpay secret keys in frontend JavaScript.


## v2 fixes
- JPG export now generates a full A4-style designed biodata and includes uploaded photo.
- Admin demo now supports rename, free/premium toggle, delete, add template, price setting, download counter and reset.
- Admin changes are stored in browser localStorage for this MVP; production requires authenticated server/database storage.
