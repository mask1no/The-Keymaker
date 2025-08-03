# Changelog

## [1.1.0] - 2024-12-15

### Added
- **Settings Validation**: Zod schema validation prevents blank RPC/API keys with real-time form validation
- **Global Connection Banner**: Sticky red banner appears when services are down with retry countdown
- **Fee-Aware PnL**: Calculations now include gas fees and Jito tips for accurate profit tracking
- **Network Switching**: Proper devnet/mainnet plumbing with hot-swap capability
- **Slippage Retry**: Automatic retry with progressive slippage increases for PumpFun/LetsBonk
- **Dynamic E2E Tests**: Test script creates real tokens on devnet for comprehensive testing
- **Configurable Bundle Capacity**: Bundle size now configurable from 1-20 transactions
- **Launch Wizard**: Step-by-step wizard with preset saving for quick strategy deployment
- **Advanced Sell UI**: Visual condition builder for complex sell strategies
- **Wallet Grouping**: Organize wallets into color-coded groups for better management
- **Docker Health Checks**: Enhanced container monitoring with graceful shutdown
- **GitHub CI/CD**: Automated testing, Docker builds, and Tauri desktop app builds
- **Release Script**: Automated semver bumping and changelog updates

### Changed
- Connection instantiation now uses centralized `getConnection()` utility
- Bundle service supports up to 20 transactions (previously hardcoded to 5)
- PnL database schema includes separate gas_fee and jito_tip columns
- Docker image uses tini for proper signal handling
- Health check endpoint returns version information

### Fixed
- Settings page Save button properly disabled until all required fields valid
- Network switching properly affects all services
- Slippage errors trigger automatic retry instead of immediate failure
- Fee calculations correctly account for all transaction costs

## [1.0.1] - 2024-12-14

### Added
- Fixed sidebar with both icons and labels (no hover animations)
- Status indicators moved to Settings page in clean 2x2 Bento grid
- Theme toggle (Dark/Light mode) fully functional with persistence
- Comprehensive error boundaries with recovery options

### Changed
- Complete removal of all mock data and placeholder values
- RPC health displays with RTT and 30-minute history charts
- All UI components are now theme-aware
- Status updates every 8 seconds automatically

### Fixed
- Inconsistent styling across dark/light themes
- Mock wallet addresses in initial state
- Status indicators not updating reliably

## [1.0.0] - 2024-12-13

### Added
- Initial production release
- SPL Token Creation & Deployment (pump.fun, Raydium, letsbonk.fun)
- Jito Bundle Execution (Stealth & Manual modes)
- Secure Wallet Management (Phantom + Keypair imports)
- Real-Time PnL Tracking with SQLite persistence
- Live Status Monitoring (RPC, WebSocket, Jito, Mainnet)
- AES-256-GCM Encryption for private keys
- 100% Production-Ready - No mock data or placeholders