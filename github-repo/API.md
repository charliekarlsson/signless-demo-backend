# API Documentation

Complete reference for SignLess API endpoints.

## Base URL

```
http://localhost:3000
```

In production, replace with your deployed domain.

## Authentication Flow

1. Client calls POST /api/auth/request with wallet address
2. Server returns sessionId, expectedAmount, and receiverAddress
3. User sends expectedAmount SOL to receiverAddress
4. Client polls GET /api/auth/verify/:sessionId
5. Server monitors blockchain and returns verified:true when transaction confirmed

## Endpoints

### POST /api/auth/request

Initiates a new authentication request.

**Request:**

```http
POST /api/auth/request
Content-Type: application/json

{
  "walletAddress": "8Z6znB8kFNyGtbKYimSK7zTE5ZgTKASjGi3ugLpeXXRu"
}
```

**Response (200 OK):**

```json
{
  "sessionId": "1733512345678_abc123",
  "expectedAmount": 0.000010456,
  "receiverAddress": "5sE9v2bPmHd3axXKXTi31tLmu8YkadLVcxgK76Pi8R3d"
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Wallet address is required"
}
```

**Fields:**

- `sessionId` (string): Unique identifier for this authentication session
- `expectedAmount` (number): Exact amount of SOL to send (dynamically generated)
- `receiverAddress` (string): Wallet address to send SOL to

---

### GET /api/auth/verify/:sessionId

Checks if authentication transaction has been detected and verified.

**Request:**

```http
GET /api/auth/verify/1733512345678_abc123
```

**Response - Pending (200 OK):**

```json
{
  "verified": false,
  "message": "Waiting for transaction"
}
```

**Response - Verified (200 OK):**

```json
{
  "verified": true,
  "walletAddress": "8Z6znB8kFNyGtbKYimSK7zTE5ZgTKASjGi3ugLpeXXRu"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Session not found"
}
```

**Fields:**

- `verified` (boolean): Authentication status
- `message` (string): Status message when pending
- `walletAddress` (string): Authenticated wallet address when verified

---

### GET /health

Server health check endpoint.

**Request:**

```http
GET /health
```

**Response (200 OK):**

```json
{
  "status": "ok"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Session does not exist |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting in production to prevent abuse.

---

## CORS

Controlled by `CORS_ORIGINS` environment variable.

**Development:**
```env
CORS_ORIGINS=*
```

**Production:**
```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## Polling Strategy

Recommended polling interval: 2-3 seconds

Example polling implementation:

```javascript
async function pollVerification(sessionId) {
  const maxAttempts = 60; // 2 minutes with 2-second intervals
  let attempts = 0;
  
  const interval = setInterval(async () => {
    attempts++;
    
    try {
      const response = await fetch(`${API_URL}/api/auth/verify/${sessionId}`);
      const data = await response.json();
      
      if (data.verified) {
        clearInterval(interval);
        console.log('Authenticated:', data.walletAddress);
        // Handle successful authentication
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.log('Authentication timeout');
        // Handle timeout
      }
    } catch (error) {
      console.error('Verification error:', error);
    }
  }, 2000);
}
```

---

## Session Management

- Sessions stored in-memory (not persistent across server restarts)
- Default timeout: 5 minutes (configurable via SESSION_TIMEOUT)
- Expired sessions automatically cleaned up
- Session IDs format: `{timestamp}_{random}`

---

## Transaction Verification

The server verifies transactions by:

1. Monitoring recent transactions to receiver wallet
2. Checking sender address matches session wallet
3. Verifying amount matches expected amount (within 0.000001 SOL tolerance)
4. Confirming transaction is finalized

**Tolerance:** ±0.000001 SOL to account for potential precision issues

---

## Best Practices

1. Always use HTTPS in production
2. Implement client-side timeout for polling
3. Display clear instructions to users about transaction amount
4. Handle session expiry gracefully
5. Store sessionId in localStorage for page refresh recovery
6. Use environment-specific API URLs
7. Implement retry logic for network errors

---

## Example Integration

Full working example:

```javascript
const API_URL = 'https://your-api.com';

class SignLessAuth {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.sessionId = null;
    this.checkInterval = null;
  }
  
  async initiate(walletAddress) {
    const response = await fetch(`${this.apiUrl}/api/auth/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    });
    
    if (!response.ok) {
      throw new Error('Failed to initiate authentication');
    }
    
    const data = await response.json();
    this.sessionId = data.sessionId;
    
    return {
      amount: data.expectedAmount,
      address: data.receiverAddress
    };
  }
  
  startPolling(onVerified, onTimeout) {
    let attempts = 0;
    const maxAttempts = 60;
    
    this.checkInterval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(
          `${this.apiUrl}/api/auth/verify/${this.sessionId}`
        );
        const data = await response.json();
        
        if (data.verified) {
          clearInterval(this.checkInterval);
          onVerified(data.walletAddress);
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(this.checkInterval);
          onTimeout();
        }
      } catch (error) {
        console.error('Verification error:', error);
      }
    }, 2000);
  }
  
  stopPolling() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Usage
const auth = new SignLessAuth(API_URL);

async function authenticate(walletAddress) {
  const { amount, address } = await auth.initiate(walletAddress);
  
  // Display to user: Send {amount} SOL to {address}
  
  auth.startPolling(
    (walletAddress) => {
      console.log('Authenticated:', walletAddress);
      // Handle success
    },
    () => {
      console.log('Authentication timeout');
      // Handle timeout
    }
  );
}
```
