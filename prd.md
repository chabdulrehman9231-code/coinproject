# Product Requirements Document (PRD) - Crypto Demo Trading Platform

## 1. Product Overview
The goal is to build a high-fidelity, exact Binance-clone crypto demo trading platform. The platform will use live market data and charts but will execute simulated (paper) trades. It will be accessible across desktop and mobile devices via a single codebase using Progressive Web App (PWA) technology, eliminating the need for App Store/Play Store deployment.

## 2. Technology Stack
- **Frontend Framework:** Next.js (React)
- **Deployment & Distribution:** PWA (Progressive Web App) for mobile and web via a single domain.
- **Styling:** TailwindCSS (Strict adherence to Binance's design language, dark mode, and UI patterns).
- **Backend/API:** Next.js Serverless API Routes.
- **Database & Backend-as-a-Service:** Supabase (PostgreSQL).
- **Authentication:** Supabase Auth (Email/Password & Social Logins).
- **Live Data Provider:** Binance WebSocket API (for real-time order book, ticker, and candlestick data).
- **Charting Library:** TradingView Lightweight Charts.

## 3. UI/UX & Design Requirements
The UI must be an exact 100% replica of the Binance trading interface (Dark Mode).

### 3.1 Color Palette (Binance Dark Theme)
- **Backgrounds:** `#181A20` (Main), `#1E2329` (Panels/Cards)
- **Primary Accent:** `#FCD535` (Binance Yellow)
- **Buy/Up Color:** `#0ECB81` (Green)
- **Sell/Down Color:** `#F6465D` (Red)
- **Text/Typography:** `#EAECEF` (Primary text), `#848E9C` (Secondary text)
- **Font:** Inter or similar clean Sans-serif font.

### 3.2 Desktop Web Layout
- **Top Navbar:** Logo, Markets, Trade, Wallet, Profile/Auth, Theme Toggle.
- **Left/Center - Charting:** TradingView chart occupying the central-left area with timeframes (1m, 5m, 1h, 1d) and indicators.
- **Right Center - Order Book:** Live updating bids (green) and asks (red) split vertically.
- **Right Sidebar - Market Pairs:** List of available trading pairs (e.g., BTC/USDT, ETH/USDT) with live 24h change.
- **Bottom Center - Order Entry:** Buy/Sell tabs, Market/Limit order types, amount sliders, and Action buttons.
- **Bottom - Trade History/Positions:** Tabs for Open Orders, Order History, Trade History, and current Demo Funds.

### 3.3 Mobile PWA Layout
- **Bottom Navigation Bar:** Home, Markets, Trade, Futures (disabled/mock), Wallets.
- **Trade Screen (Mobile):** Header with Pair name, central chart (toggleable), Order Book on the right half, Buy/Sell form on the left half, and Positions list at the bottom.

## 4. Core Features

### 4.1 User Authentication (Supabase Auth)
- User sign-up and login using email/password.
- Session management and protected routes.

### 4.2 Portfolio & Virtual Wallet
- Upon registration, every user automatically receives a virtual starting balance (e.g., $10,000 USDT).
- Wallet dashboard showing Total Balance in USDT, and individual asset holdings (e.g., 0.5 BTC).
- Live PnL (Profit and Loss) calculation based on current asset prices.

### 4.3 Live Market Data (Binance WebSocket)
- Real-time candlestick data streaming to TradingView chart.
- Real-time Order Book updates (Level 2 data) streaming to the UI.
- 24hr Ticker updates (Price, Volume, Change %).

### 4.4 Demo Trading Engine
- **Order Types:**
  - **Market Orders:** Execute instantly at the current live market price.
  - **Limit Orders:** Placed in the database and executed only when the live price crosses the target price.
- **Trade Execution:**
  - When a buy order executes, deduct USDT from the user's wallet and add the crypto asset (e.g., BTC).
  - When a sell order executes, deduct the crypto asset and add USDT.
  - Handle sufficient balance validation (cannot buy without enough USDT).

## 5. Database Schema (Supabase PostgreSQL)

### 5.1 `users` (Managed by Supabase Auth)
- Base user identity.

### 5.2 `profiles` (Extended User Data)
- `id` (UUID, references auth.users)
- `email` (String)
- `created_at` (Timestamp)

### 5.3 `wallets` (User Balances)
- `id` (UUID)
- `user_id` (UUID, references profiles)
- `asset` (String, e.g., "USDT", "BTC")
- `balance` (Numeric, default 0)
- *Note: A user will have one row per asset they hold.*

### 5.4 `orders` (Trading History & Active Orders)
- `id` (UUID)
- `user_id` (UUID, references profiles)
- `symbol` (String, e.g., "BTCUSDT")
- `order_type` (Enum: 'MARKET', 'LIMIT')
- `side` (Enum: 'BUY', 'SELL')
- `price` (Numeric) - Relevant for Limit orders, or execution price for Market.
- `amount` (Numeric) - Quantity of the asset.
- `status` (Enum: 'OPEN', 'FILLED', 'CANCELLED')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## 6. Implementation Phases

- **Phase 1: Setup & Foundation**
  - Initialize Next.js, TailwindCSS, and `next-pwa`.
  - Setup Supabase project and connect to the app.
  - Implement Auth UI and flow.
- **Phase 2: UI & Layouts**
  - Build the Binance-clone structural layout (Desktop & Mobile).
  - Setup color tokens in Tailwind config.
- **Phase 3: Live Data & Charting**
  - Integrate TradingView Lightweight Charts.
  - Establish Binance WebSocket connections for Chart, Order Book, and Ticker.
- **Phase 4: Trading Engine & State**
  - Build API routes for placing Market and Limit orders.
  - Implement Supabase database logic for updating wallets.
  - Build the Order Form UI and link it to the backend.
- **Phase 5: Polish & PWA Completion**
  - Ensure 100% responsiveness.
  - Configure PWA manifest for native app installation feel.
  - Final testing of demo trading edge cases (e.g., insufficient balance).

## User Review Required
> [!IMPORTANT]
> Please review this PRD carefully. This document will serve as our master blueprint. Once you approve it, we will move directly to **Phase 1 (Setup & Foundation)** and start writing the code!
