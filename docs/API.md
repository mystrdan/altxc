# ALTXC API Documentation

All endpoints are versioned under `/api/v1`. Every response follows a consistent envelope:

**Success:** `{ "success": true, "data": ... }`
**Error:** `{ "success": false, "error": { "message": "...", "details": [...] } }`

## Authentication

### POST `/api/v1/auth/register`
Register a new account.

**Request:**
```json
{ "username": "trader1", "email": "user@example.com", "password": "SecurePass1" }
```

**Response (201):**
```json
{ "success": true, "data": { "token": "...", "refreshToken": "...", "user": { "id": "...", "username": "...", "email": "...", "role": "user" } } }
```

### POST `/api/v1/auth/login`
Log in with username or email.

**Request:**
```json
{ "identifier": "trader1", "password": "SecurePass1" }
```

### POST `/api/v1/auth/refresh`
Refresh an expired access token using a refresh token.

**Request:**
```json
{ "refreshToken": "..." }
```

**Response:**
```json
{ "success": true, "data": { "token": "...", "refreshToken": "..." } }
```

### POST `/api/v1/auth/logout`
Revoke a refresh token. Requires auth.

### POST `/api/v1/auth/logout-all`
Revoke all sessions for the current user. Requires auth.

### GET `/api/v1/auth/me`
Get the current authenticated user. Requires auth.

### POST `/api/v1/auth/forgot-password`
Skeleton endpoint. Returns a generic message.

### POST `/api/v1/auth/reset-password`
Skeleton endpoint. Returns a placeholder message.

## Profiles

### GET `/api/v1/profile/:username`
Get a public profile by username.

### PUT `/api/v1/profile`
Update the current user's profile. Requires auth.

**Request:**
```json
{ "displayName": "My Name", "bio": "Trader", "supportedMarkets": ["VRSC", "BTC"] }
```

### GET `/api/v1/dashboard`
Get the current user's dashboard summary. Requires auth.

## Markets

### GET `/api/v1/markets`
List all markets with statistics (active listings, buyer/seller counts, avg rating).

### GET `/api/v1/markets/:symbol`
Get a single market by symbol.

## Listings

### GET `/api/v1/listings`
List all listings with optional filters: `type`, `coin`, `marketId`, `status`, `sellerId`, `sort`.

### GET `/api/v1/listings/my`
Get the current user's listings. Requires auth.

### GET `/api/v1/listings/:id`
Get a single listing by ID.

### POST `/api/v1/listings`
Create a new listing. Requires auth.

**Request:**
```json
{ "type": "sell", "coin": "VRSC", "amount": 500, "price": 1.0, "marketId": "..." }
```

### PUT `/api/v1/listings/:id`
Update a listing (owner only). Requires auth.

### DELETE `/api/v1/listings/:id`
Close a listing (owner only). Requires auth.

## Trades

### POST `/api/v1/trades/request`
Send a trade request to a listing's seller. Requires auth.

**Request:**
```json
{ "listingId": "...", "message": "Looking forward to trading!" }
```

### GET `/api/v1/trades/requests`
Get trade requests. Query param `direction=sent` or `direction=received`.

### PATCH `/api/v1/trades/requests/:id`
Accept or decline a trade request (seller only). Requires auth.

**Request:**
```json
{ "action": "accepted" }
```

### PATCH `/api/v1/trades/requests/:id/cancel`
Cancel a trade request (buyer only). Requires auth.

### GET `/api/v1/trades`
Get all trades for the current user. Requires auth.

### GET `/api/v1/trades/:id`
Get trade room details (buyer/seller only). Requires auth.

### POST `/api/v1/trades/:id/messages`
Send a message in a trade room. Requires auth.

**Request:**
```json
{ "content": "Hello, ready to proceed?" }
```

### PATCH `/api/v1/trades/:id/status`
Update trade status. Requires auth.

**Request:**
```json
{ "status": "in_escrow" }
```

Valid transitions: `pending → in_escrow | cancelled`, `in_escrow → completed | disputed`.

## Reports

### POST `/api/v1/reports`
Report a user. Requires auth.

**Request:**
```json
{ "reportedUsername": "scammer", "reason": "Fake listing" }
```

## Admin (requires admin role)

### GET `/api/v1/admin/users`
List all users.

### PATCH `/api/v1/admin/users/:id/role`
Update a user's role.

### POST `/api/v1/admin/markets`
Create a market.

### PATCH `/api/v1/admin/markets/:id`
Update a market.

### DELETE `/api/v1/admin/markets/:id`
Delete a market.

### GET `/api/v1/admin/listings`
List all listings (admin view).

### GET `/api/v1/admin/reports`
List all reports.

### PATCH `/api/v1/admin/reports/:id/status`
Update a report's status.

### GET `/api/v1/admin/settings`
Get platform settings (placeholder).

## Status

### GET `/api/v1/status`
Health check endpoint.

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Authentication required / invalid token |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate, already exists) |
| 422 | Validation failed |
| 429 | Too many requests (rate limited) |
| 500 | Internal server error |
</arg_value>
</write_to_file></tool_call>