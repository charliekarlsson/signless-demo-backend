# Repository Structure

Complete overview of the SignLess repository.

## Root Files

### Documentation
- `README.md` - Main project documentation and overview
- `QUICKSTART.md` - 5-minute getting started guide
- `API.md` - Complete API reference
- `DEPLOYMENT.md` - Platform-specific deployment guides
- `CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history and changes
- `LICENSE` - MIT License

### Configuration
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore patterns
- `package.json` - Node.js dependencies and scripts

## Source Code (`src/`)

### Server (`src/server.js`)
Main application entry point:
- Express server setup
- CORS configuration
- Route mounting
- Health check endpoint
- Session cleanup scheduler

### Routes (`src/routes/`)
API endpoint definitions:
- `auth.js` - Authentication endpoints
  - POST /api/auth/request
  - GET /api/auth/verify/:sessionId

### Services (`src/services/`)
Business logic layer:

- `sessionManager.js` - Session management
  - Create authentication sessions
  - Generate dynamic amounts
  - Store and retrieve sessions
  - Session expiry and cleanup

- `solana.js` - Blockchain interaction
  - Initialize Solana connection
  - Monitor wallet transactions
  - Verify transaction amounts
  - Check transaction finality

## Examples (`examples/`)

### Files
- `basic-integration.html` - Complete HTML example
- `signless-sdk.js` - Reusable JavaScript SDK
- `README.md` - Integration patterns and examples

### Integration Patterns Included
- Vanilla JavaScript
- React hooks
- Vue composition API
- Next.js API routes
- Phantom wallet integration

## Installation

```bash
npm install
```

## Configuration

```bash
cp .env.example .env
# Edit .env with your settings
```

## Development

```bash
npm start
```

Server starts on port 3000 (configurable).

## Production Deployment

See DEPLOYMENT.md for detailed guides:
- Railway
- Render
- Vercel
- Heroku
- DigitalOcean
- Custom VPS

## API Endpoints

### POST /api/auth/request
Initiate authentication

**Request:**
```json
{
  "walletAddress": "string"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "expectedAmount": number,
  "receiverAddress": "string"
}
```

### GET /api/auth/verify/:sessionId
Check authentication status

**Response (verified):**
```json
{
  "verified": true,
  "walletAddress": "string"
}
```

**Response (pending):**
```json
{
  "verified": false,
  "message": "Waiting for transaction"
}
```

### GET /health
Health check

**Response:**
```json
{
  "status": "ok"
}
```

## Environment Variables

Required:
- `RECEIVER_WALLET_ADDRESS` - Your Solana wallet
- `SOLANA_RPC_URL` - Solana RPC endpoint

Optional:
- `PORT` - Server port (default: 3000)
- `VERIFICATION_AMOUNT` - Base amount (default: 0.00001)
- `SESSION_TIMEOUT` - Timeout in ms (default: 300000)
- `CORS_ORIGINS` - Allowed origins (default: *)

## Security

- Sessions stored in-memory
- Automatic session expiry
- CORS protection
- Transaction verification with tolerance
- No private keys stored

## Dependencies

Core:
- express - Web framework
- @solana/web3.js - Solana blockchain
- cors - CORS middleware
- dotenv - Environment variables

Development:
- nodemon - Development server (optional)

## Testing

Manual testing:
1. Start server
2. Use examples/basic-integration.html
3. Send test transaction
4. Verify authentication

## Common Issues

### Port Already in Use
Change PORT in .env

### CORS Errors
Update CORS_ORIGINS in .env

### Transaction Not Detected
- Check wallet is funded (0.001 SOL minimum)
- Verify RPC endpoint
- Check amount matches exactly
- Wait for transaction finality

### Session Expired
- Default timeout: 5 minutes
- Increase SESSION_TIMEOUT
- Store sessionId in localStorage

## Performance

- In-memory sessions: Fast access
- RPC polling: ~2 second intervals
- Session cleanup: Every 5 minutes
- No database required

## Scalability

For high traffic:
- Use Redis for session storage
- Implement connection pooling
- Use paid RPC provider
- Add rate limiting
- Implement caching
- Monitor memory usage

## Cost Analysis

Per authentication:
- SOL cost: ~0.00001 ($0.002)
- RPC calls: ~30 (during 60s window)
- Server cost: Minimal

Monthly (1000 authentications):
- SOL cost: ~$2
- Server: $5-20 depending on platform
- RPC: Free with public endpoints

## Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Documentation: This repository

## Contributing

See CONTRIBUTING.md for:
- Code style guidelines
- Pull request process
- Issue reporting
- Development setup

## License

MIT License - See LICENSE file

## Version

Current: 2.0.0
See CHANGELOG.md for version history

## Links

- Live Demo: (Add your demo URL)
- API Documentation: API.md
- Quick Start: QUICKSTART.md
- Deployment: DEPLOYMENT.md
