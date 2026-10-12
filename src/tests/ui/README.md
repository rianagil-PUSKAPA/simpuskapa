# Guide to run a test cases using playwright for SIMPUSKAPA project

1. Run command `npx playwright test --project=chromium --workers=1` to run sequence order file execution based on file name order
2. Change block code line 52 at `src/tests/ui/004-advance-payment-request.spec.ts` Choose and match with EXPECTED_PAYMENT_STATEMENT constant option at `src/tests/ui/testing-constant.ts`
