<div align="center">
  <img src="gitlogo.png" alt="SignLess Logo" width="200">
  
  # SignLess
  
  Passwordless authentication for Solana using micro-transactions. No signatures, no popups, just a simple wallet transfer for instant authentication.
</div>

## Overview

SignLess provides a novel approach to blockchain authentication by using micro-transactions instead of message signatures. Users authenticate by sending a small, dynamically-generated amount of SOL to a designated wallet address. The backend monitors the blockchain for matching transactions and establishes authenticated sessions.

## Features

- No wallet signature popups
- Dynamic transaction amounts for enhanced security
- Session-based authentication with automatic expiry
- RESTful API architecture
- CORS-enabled for cross-origin requests
- In-memory session management

## How It Works

1. User initiates authentication through your application
2. Backend generates a unique transaction amount (e.g., 0.000010456 SOL)
3. User sends the specified amount from their Solana wallet
4. Backend detects the transaction on-chain and verifies the amount
5. Session is created and authenticated

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
RECEIVER_WALLET_ADDRESS=your_solana_wallet_address
VERIFICATION_AMOUNT=0.00001
SESSION_TIMEOUT=300000
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Environment Variables

- `PORT` - Server port (default: 3000)
- `RECEIVER_WALLET_ADDRESS` - Solana wallet address to receive authentication transactions
- `VERIFICATION_AMOUNT` - Base amount in SOL for authentication (default: 0.00001)
- `SESSION_TIMEOUT` - Session duration in milliseconds (default: 300000 = 5 minutes)
- `SOLANA_RPC_URL` - Solana RPC endpoint URL
- `CORS_ORIGINS` - Comma-separated list of allowed origins, or * for all origins

## Usage

Start the server:

```bash
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### POST /api/auth/request

Initiates an authentication request.

**Request Body:**
```json
{
  "walletAddress": "user_wallet_public_key"
}
```

**Response:**
```json
{
  "sessionId": "unique_session_identifier",
  "expectedAmount": 0.000010456,
  "receiverAddress": "receiver_wallet_public_key"
}
```

### GET /api/auth/verify/:sessionId

Checks authentication status for a session.

**Response (Pending):**
```json
{
  "verified": false,
  "message": "Waiting for transaction"
}
```

**Response (Verified):**
```json
{
  "verified": true,
  "walletAddress": "user_wallet_public_key"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Frontend Integration

Example implementation using vanilla JavaScript:

```javascript
const API_URL = 'http://localhost:3000';

async function authenticate(walletAddress) {
  // Request authentication
  const response = await fetch(`${API_URL}/api/auth/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });
  
  const { sessionId, expectedAmount, receiverAddress } = await response.json();
  
  // Display transaction details to user
  console.log(`Send ${expectedAmount} SOL to ${receiverAddress}`);
  
  // Poll for verification
  const checkInterval = setInterval(async () => {
    const verifyResponse = await fetch(`${API_URL}/api/auth/verify/${sessionId}`);
    const result = await verifyResponse.json();
    
    if (result.verified) {
      clearInterval(checkInterval);
      console.log('Authentication successful');
      // Proceed with authenticated session
    }
  }, 2000);
}
```

## Deployment

### Railway

1. Push code to GitHub repository
2. Connect repository to Railway
3. Add environment variables in Railway dashboard
4. Deploy automatically on push

### Render

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts to deploy
4. Add environment variables in Vercel dashboard

## Security Considerations

- Use a dedicated wallet for receiving authentication transactions
- Implement rate limiting to prevent abuse
- Set appropriate session timeouts
- Use HTTPS in production
- Consider using a paid RPC provider for better reliability
- Monitor wallet balance and transaction patterns

## Cost Analysis

- Each authentication costs approximately $0.002 USD (based on 0.00001 SOL)
- 1000 authentications = ~$2 USD
- Receiving wallet must maintain minimum balance for rent-exemption (0.001 SOL)

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please visit the GitHub repository issues page.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.
