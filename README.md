# VivahBio + Razorpay Test Mode

## Added
- Vercel serverless `/api/create-order` endpoint
- Vercel serverless `/api/verify-payment` endpoint
- Razorpay Checkout
- ₹19 order amount (1900 paise)
- Server-side signature verification
- Premium unlock stored locally after verified test payment

## GitHub/Vercel setup
1. Upload these files to the repository.
2. Vercel will detect the `api/` serverless functions.
3. In Vercel Project Settings → Environment Variables add:
   - `RAZORPAY_KEY_ID` = your `rzp_test_...` key ID
   - `RAZORPAY_KEY_SECRET` = your Razorpay Test Mode secret
4. Apply variables to Production/Preview as needed and redeploy.
5. Test the ₹19 checkout.

## Security
Never commit the Razorpay Key Secret to GitHub or frontend JavaScript.

## Important
This is a Test Mode integration. Real payments require Live Mode keys and Razorpay account activation/KYC.
