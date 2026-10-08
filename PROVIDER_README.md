# GlobalNum Store — Provider Fulfillment Foundation

This build adds a server-side provider adapter. It is **MOCK by default**, so it does not purchase real numbers.

## Flow
1. Customer submits an OPay payment.
2. Admin verifies the payment.
3. Only a paid order should be sent for fulfillment.
4. The server-side adapter requests a number from an authorized provider.
5. The provider response is then stored server-side in the production version.

## Configure an authorized provider
Set these environment variables on the server only:
- `PROVIDER_MODE=http`
- `PROVIDER_BASE_URL=...`
- `PROVIDER_API_KEY=...`

The adapter expects a documented `POST /numbers` endpoint accepting `{countryCode,countryName}`. Different providers should get their own adapter matching their official documentation.

Do not put provider API keys in `index.html` or other browser code.

This project does not implement OTP interception, verification-code retrieval, fake-account creation, or platform verification bypass. Use numbers only in ways permitted by the provider and the relevant platform rules.
