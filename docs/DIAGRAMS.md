# Visual Guides & Diagrams

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                              │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend (Port 5173)                     │   │
│  │                                                                   │   │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐  │   │
│  │  │  Wallet Button  │  │  Input Field │  │  Status Display  │  │   │
│  │  └─────────────────┘  └──────────────┘  └──────────────────┘  │   │
│  │                                                                   │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │     Solana Wallet Adapter (Phantom/Solflare)             │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/REST API
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Backend Server (Port 3000)                           │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Express.js API                             │  │
│  │                                                                   │  │
│  │  API Endpoints:                                                   │  │
│  │  • POST /api/auth/initiate    → Start authentication             │  │
│  │  • POST /api/auth/verify      → Verify transaction               │  │
│  │  • GET  /api/auth/status/:id  → Check auth status                │  │
│  │  • POST /api/auth/logout      → End session                      │  │
│  │  • GET  /health               → Health check                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────┐        ┌────────────────────────────────────┐    │
│  │  Session Manager │        │  Solana Service                    │    │
│  │                  │        │                                     │    │
│  │  • Create        │        │  • Transaction verification        │    │
│  │  • Verify        │        │  • Address validation              │    │
│  │  • Track         │        │  • Blockchain monitoring           │    │
│  │  • Expire        │        │  • Connection management           │    │
│  └──────────────────┘        └────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ @solana/web3.js
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Solana Blockchain Network                         │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         RPC Endpoint                              │  │
│  │              (Alchemy / QuickNode / Helius)                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  • Transaction confirmation                                              │
│  • Balance verification                                                  │
│  • Wallet validation                                                     │
│  • Transaction history                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Authentication Flow Diagram

```
┌──────┐                                                          
│ USER │                                                          
└──┬───┘                                                          
   │                                                              
   │ 1. Opens App                                                
   ▼                                                              
┌─────────────────┐                                              
│   Web Browser   │                                              
│  (localhost:    │                                              
│     5173)       │                                              
└────────┬────────┘                                              
         │                                                        
         │ 2. Connect Wallet                                     
         ▼                                                        
    ┌─────────┐                                                  
    │ Phantom │                                                  
    │ Wallet  │                                                  
    └────┬────┘                                                  
         │                                                        
         │ 3. Wallet Connected                                   
         │    (publicKey available)                              
         ▼                                                        
┌─────────────────┐                                              
│   Frontend      │  4. POST /api/auth/initiate                 
│   React App     │ ────────────────────────────>                
└─────────────────┘                       ┌────────────────┐    
         │                                │   Backend API  │    
         │  5. Session Created            │   (Express.js) │    
         │  { sessionId, receiver,        └───────┬────────┘    
         │    amount, expires }                   │             
         │ <────────────────────────────────────  │             
         │                                         │             
         │ 6. Show transaction                     │             
         │    request to user                      │             
         ▼                                         │             
    ┌─────────┐                                   │             
    │  User   │                                   │             
    │ Approves│                                   │             
    └────┬────┘                                   │             
         │                                         │             
         │ 7. Sign & Send Transaction             │             
         ▼                                         │             
    ┌─────────┐                                   │             
    │ Phantom │  8. Transaction                   │             
    │ Wallet  │ ──────────────────>               │             
    └─────────┘              ┌─────────────────┐  │             
         │                   │ Solana Network  │  │             
         │                   └────────┬────────┘  │             
         │ 9. TX Signature            │           │             
         │ <──────────────────────────┘           │             
         ▼                                         │             
┌─────────────────┐                                │             
│   Frontend      │  10. POST /api/auth/verify    │             
│                 │  { sessionId, signature }     │             
│                 │ ────────────────────────────> │             
└─────────────────┘                               │             
         │                                         │             
         │                                         │ 11. Verify  
         │                                         │     on chain
         │                                         ▼             
         │                               ┌─────────────────┐    
         │                               │ Solana Network  │    
         │                               └────────┬────────┘    
         │                                         │             
         │                                         │ 12. Valid   
         │  13. Authentication Success             │             
         │  { success: true,                       │             
         │    walletAddress, ... }                 │             
         │ <──────────────────────────────────────┘             
         ▼                                                        
┌─────────────────┐                                              
│ Success Screen  │                                              
│ User Logged In! │                                              
└─────────────────┘                                              
```

## Session Lifecycle

```
CREATE → PENDING → VERIFIED → EXPIRED/LOGOUT

┌─────────────┐
│   CREATE    │  User initiates authentication
└──────┬──────┘  POST /api/auth/initiate
       │
       │ Session created with UUID
       │ Expiry time set (15 mins default)
       │
       ▼
┌─────────────┐
│   PENDING   │  Waiting for transaction
└──────┬──────┘  User has time to send TX
       │
       │ OPTIONS:
       │
       ├─── User sends valid TX ──────┐
       │                               │
       │                               ▼
       │                        ┌─────────────┐
       │                        │  VERIFIED   │  Authentication successful
       │                        └──────┬──────┘  Session active
       │                               │
       │                               │ User can access protected routes
       │                               │
       │                               ├─── Session expires ───┐
       │                               │                        │
       │                               └─── User logs out ──────┤
       │                                                         │
       └─── Time expires (15 min) ─────────────────────────────┤
                                                                 │
                                                                 ▼
                                                          ┌─────────────┐
                                                          │   EXPIRED   │
                                                          │  or LOGOUT  │
                                                          └─────────────┘
                                                          Session removed
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Input Validation│
                    │  - Wallet format │
                    │  - Required data │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Session Manager  │
                    │ - Create session │
                    │ - Generate UUID  │
                    │ - Set expiry     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Store in       │
                    │   Memory/DB      │
                    └────────┬─────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESPONSE TO CLIENT                        │
│  { sessionId, receiverAddress, amount, expiresAt }          │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ User sends transaction
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 VERIFICATION REQUEST                         │
│          { sessionId, signature }                            │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Retrieve Session│
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Solana Service   │
                    │ - Get TX details │
                    │ - Check sender   │
                    │ - Check receiver │
                    │ - Check amount   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Verification    │
                    │  Result          │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Update Session   │
                    │ status=verified  │
                    └────────┬─────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUCCESS RESPONSE                            │
│  { success: true, walletAddress, signature }                │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                               │
├──────────────────────────────────────────────────────────────┤
│  React 18             │  User Interface Framework            │
│  Vite                 │  Build Tool & Dev Server             │
│  @solana/wallet-      │  Wallet Connection & Management      │
│    adapter            │                                      │
│  @solana/web3.js      │  Solana Blockchain Interaction       │
│  Axios                │  HTTP Client                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        BACKEND                                │
├──────────────────────────────────────────────────────────────┤
│  Node.js 18+          │  JavaScript Runtime                  │
│  Express.js           │  Web Framework                       │
│  @solana/web3.js      │  Blockchain SDK                      │
│  dotenv               │  Environment Config                  │
│  uuid                 │  Session ID Generation               │
│  cors                 │  Cross-Origin Resource Sharing       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     BLOCKCHAIN                                │
├──────────────────────────────────────────────────────────────┤
│  Solana Network       │  Layer 1 Blockchain                  │
│  RPC Providers        │  Alchemy, QuickNode, Helius          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  DEPLOYMENT (OPTIONS)                         │
├──────────────────────────────────────────────────────────────┤
│  Railway              │  Backend Hosting                     │
│  Vercel/Netlify       │  Frontend Hosting                    │
│  Docker               │  Containerization                    │
│  AWS/DigitalOcean     │  VPS Hosting                        │
└──────────────────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                          │
└─────────────────────────────────────────────────────────────┘

Layer 1: INPUT VALIDATION
├─ Wallet address format check
├─ Required fields validation
└─ Data type verification

Layer 2: BLOCKCHAIN VERIFICATION
├─ Transaction exists on-chain
├─ Transaction confirmed
├─ Sender matches claimed wallet
├─ Receiver matches service wallet
└─ Amount matches expected value

Layer 3: SESSION SECURITY
├─ UUID session IDs (non-guessable)
├─ Time-limited sessions (15 min default)
├─ Automatic cleanup of expired sessions
└─ Single-use verification

Layer 4: API SECURITY
├─ CORS configuration
├─ HTTPS in production
├─ Rate limiting (recommended)
└─ Input sanitization

Layer 5: INFRASTRUCTURE
├─ Environment variables for secrets
├─ No private keys stored
├─ Secure RPC connections
└─ Error message sanitization
```

## Deployment Topology

```
DEVELOPMENT ENVIRONMENT
┌────────────────────────────────────────┐
│  Localhost (Your Computer)             │
│  ┌──────────────┐  ┌────────────────┐ │
│  │  Backend     │  │  Frontend      │ │
│  │  :3000       │  │  :5173         │ │
│  └──────────────┘  └────────────────┘ │
└────────────────────────────────────────┘
              │
              ▼
     Solana Devnet

PRODUCTION ENVIRONMENT
┌────────────────────────────────────────┐
│          CDN (CloudFlare)              │
│        Frontend Static Files           │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│         Vercel/Netlify                 │
│         React Frontend                 │
│         (your-app.vercel.app)          │
└──────────────┬─────────────────────────┘
               │
               │ API Calls
               ▼
┌────────────────────────────────────────┐
│         Railway/Heroku                 │
│         Backend API                    │
│         (your-api.railway.app)         │
│  ┌──────────────────────────────────┐ │
│  │  Express Server                  │ │
│  │  Session Management              │ │
│  │  Solana Integration              │ │
│  └──────────────────────────────────┘ │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│       RPC Provider                     │
│       (Alchemy/QuickNode)              │
└──────────────┬─────────────────────────┘
               │
               ▼
      Solana Mainnet-Beta
```

---

These diagrams provide visual understanding of:
- System architecture
- Authentication flow
- Session lifecycle
- Data processing
- Technology stack
- Security layers
- Deployment topology

Use these as reference when explaining the system to others or when planning modifications!
