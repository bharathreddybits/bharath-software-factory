-- Drop the stripe_customer_id column from organizations.
-- This column was never used — the payment system uses DoDo Payments and Razorpay,
-- with gateway customer IDs stored in the subscriptions table instead.

ALTER TABLE "organizations" DROP COLUMN IF EXISTS "stripe_customer_id";
