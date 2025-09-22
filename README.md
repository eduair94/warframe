# Warframe Market Analytics

> ⚠️ **SECURITY NOTICE**: This repository does NOT contain any sensitive data such as API keys, proxy lists, or database credentials. All sensitive configuration must be set up locally using environment variables. See the [Security](#security) section below.

A comprehensive web application for analyzing Warframe market data, including real-time price tracking, item statistics, and riven mod analytics. This project consists of a Node.js/TypeScript backend API and a Nuxt.js frontend web application.

## Features

- **Real-time Market Data**: Automatically syncs with Warframe Market API to gather current item prices and statistics
- **Price Analytics**: Track buy/sell prices, trading volumes, and price trends for all Warframe items
- **Riven Mod Tracking**: Specialized analytics for riven mod auctions and pricing
- **Relic Information**: Complete database of relics and their contents
- **Advanced Filtering**: Search and filter items by name, category, volume, and other criteria
- **Responsive Web Interface**: Clean, modern UI built with Vue.js and Vuetify
- **Anti-Detection System**: Built-in proxy rotation and request throttling to avoid rate limiting
- **Automated Data Sync**: Background processes to keep market data up-to-date

## Architecture

```
warframe/
├── 📁 Express/          # Backend API server
├── 📁 app/              # Frontend Nuxt.js application
├── 📁 proxies/          # Proxy configuration files
├── 📄 server.ts         # Main API server entry point
├── 📄 warframe.ts       # Core Warframe API client
├── 📄 database.ts       # MongoDB connection and models
└── 📄 sync_*.ts         # Data synchronization scripts
```

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **TypeScript** (v4.0.0 or higher) - Installed globally or via npm
- **PM2** (optional, for production deployment) - `npm install -g pm2`

### System Requirements

- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: At least 1GB free space for database and cache
- **Network**: Stable internet connection for API data synchronization

## 🔒 Security

### ⚠️ IMPORTANT: No Sensitive Data in Repository

This repository is designed to be **100% safe for public use** and contains **NO sensitive data**:

- ❌ **No API keys** or authentication tokens
- ❌ **No proxy server lists** or IP addresses  
- ❌ **No database credentials** or connection strings
- ❌ **No private configuration** data
- ✅ **Only example templates** and placeholder files

### What YOU Need to Configure Locally

All sensitive configuration must be set up on your local machine:

1. **Environment Variables**: Copy `.env.example` to `.env` and add your settings
2. **Proxy Files**: Create actual proxy lists in `proxies/` directory (optional)
3. **Database**: Set up your own MongoDB instance
4. **API Keys**: Obtain your own API keys from respective services

### Files That Should NEVER Be Committed

The `.gitignore` is configured to prevent these sensitive files from being committed:
- `.env` files with real credentials
- `proxies/*.txt` files with actual proxy data
- Database dumps or backups
- Any files containing passwords, tokens, or keys

### Quick Security Checklist

Before pushing any changes:
- [ ] No real API keys in code
- [ ] No actual proxy URLs committed
- [ ] No database credentials in files
- [ ] All sensitive data uses environment variables
- [ ] `.env` file is in `.gitignore`

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/eduair94/warframe
cd warframe
```

### 2. Install Backend Dependencies

```bash
# Install main project dependencies
npm install

# Install frontend dependencies
cd app
npm install
cd ..
```

### 3. Set Up Environment Variables

**⚠️ CRITICAL: Configure your local environment**

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your **real** configuration:

```env
# MongoDB Configuration (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/warframe

# Proxy Configuration (OPTIONAL - for avoiding rate limits)
PROXY_API_KEY=your_actual_proxyscrape_api_key_here
PROXY_TYPE=http
PROXY_LESS=false
PROXY_TYPE_REGION=usa

# Server Configuration (OPTIONAL)
API_PORT=3529
FRONTEND_PORT=3312
```

**🔒 Security Reminder**: The `.env` file you create will contain your real credentials and should **NEVER** be committed to version control. It's already in `.gitignore` for your protection.

### 4. Set Up MongoDB

#### Option A: Local MongoDB Installation

1. Install MongoDB Community Edition
2. Start the MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string and update `MONGODB_URI` in `.env`

### 5. Configure Proxies (Optional)

For better rate limiting handling, you can configure proxy support:

1. Sign up for a proxy service like [ProxyScrape](https://proxyscrape.com/) (optional)
2. Add your API key to the `.env` file
3. Or set `PROXY_LESS=true` to disable proxy usage

## Usage

### Development Mode

#### 1. Start the Backend API

```bash
# Development mode with hot reload
npm run dev

# This will start the API server on http://localhost:3529
```

#### 2. Start the Frontend (in a new terminal)

```bash
cd app
npm run dev

# This will start the frontend on http://localhost:3312
```

#### 3. Initialize the Database

Run the initial data synchronization:

```bash
# Sync all Warframe items (run this first)
npm run sync_items

# Sync current market prices
npm run sync_prices

# Sync riven mod data
npm run sync_rivens

# Sync auction data
npm run sync_auctions
```

### Production Deployment

#### 1. Build the Applications

```bash
# Build backend
npm run build

# Build frontend
cd app
npm run build
cd ..
```

#### 2. Start with PM2

```bash
# Start all services using PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs
```

### Available Scripts

#### Backend Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run sync_items` - Sync all Warframe items from API
- `npm run sync_prices` - Update current market prices
- `npm run sync_rivens` - Sync riven mod data
- `npm run sync_auctions` - Sync auction data
- `npm test` - Run test suite

#### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run generate` - Generate static site

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /` - Get all items with market data
- `GET /set/:url_name` - Get specific item set information
- `GET /rivens` - Get all riven mod data
- `GET /relics` - Get all relic information
- `GET /build_relics` - Get processed relic data
- `GET /relic/:url_name` - Get specific relic information

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/warframe` | Yes |
| `PROXY_API_KEY` | ProxyScrape API key for proxy rotation | - | No |
| `PROXY_TYPE` | Type of proxy (http/socks5) | `http` | No |
| `PROXY_LESS` | Disable proxy usage | `false` | No |
| `PROXY_TYPE_REGION` | Proxy region preference | - | No |
| `API_PORT` | Backend API port | `3529` | No |
| `FRONTEND_PORT` | Frontend application port | `3312` | No |

### Proxy Configuration

The application supports proxy rotation to avoid rate limiting:

1. **HTTP/HTTPS Proxies**: Standard HTTP proxies
2. **SOCKS5 Proxies**: More secure SOCKS5 proxies
3. **Geographic Targeting**: USA-specific proxy pools
4. **Automatic Rotation**: Failed proxies are automatically rotated
5. **Proxy-less Mode**: Disable proxies entirely with `PROXY_LESS=true`

## Data Synchronization

The application includes several synchronization scripts that should be run periodically:

### Initial Setup

```bash
# 1. Sync all items first (required)
npm run sync_items

# 2. Then sync prices and other data
npm run sync_prices
npm run sync_rivens
npm run sync_auctions
```

### Automated Sync (Production)

The PM2 configuration includes automated scheduling:

- **Items**: Daily at midnight
- **Prices**: Continuous updates
- **Auctions**: Continuous updates
- **Rivens**: Manual or scheduled

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check if MongoDB is running
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl status mongod
```

#### 2. Port Already in Use

```bash
# Kill process using port 3529
npx kill-port 3529

# Or change ports in .env file
API_PORT=3530
FRONTEND_PORT=3313
```

#### 3. API Rate Limiting (403 Errors)

- Enable proxy usage in `.env`: `PROXY_LESS=false`
- Add a valid `PROXY_API_KEY`
- Reduce sync frequency

#### 4. Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Debug Mode

Enable debug logging:

```bash
# Add to .env file
DEBUG=warframe:*
NODE_ENV=development
```

## Performance Optimization

### Database Optimization

1. **Indexes**: The application automatically creates necessary indexes
2. **Connection Pooling**: MongoDB connections are pooled for efficiency
3. **Query Optimization**: Aggregation pipelines are used for complex queries

### API Optimization

1. **Caching**: Response caching is enabled for frequently accessed data
2. **Rate Limiting**: Built-in throttling prevents API abuse
3. **Proxy Rotation**: Automatic proxy switching for better performance

### Frontend Optimization

1. **Code Splitting**: Automatic code splitting with Nuxt.js
2. **Image Optimization**: Images are served from CDN
3. **Caching**: Browser caching for static assets

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Add JSDoc comments for new functions
- Write unit tests for new features
- Use ESLint and Prettier for code formatting
- Update documentation for API changes

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Warframe Market API** - For providing market data
- **Digital Extremes** - For creating Warframe
- **ProxyScrape** - For proxy services
- **MongoDB** - For database solutions
- **Vue.js/Nuxt.js** - For the frontend framework

## Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/yourusername/warframe-market-analytics/issues)
3. Create a new issue with detailed information
4. Join our community discussions

## Roadmap

- [ ] Real-time price alerts
- [ ] Mobile app development
- [ ] Advanced market predictions
- [ ] User portfolio tracking
- [ ] Integration with Warframe in-game chat
- [ ] Historical price charts
- [ ] Market trend analysis

---

**Disclaimer**: This project is not affiliated with Digital Extremes or Warframe Market. It is a community-driven analytics tool for educational and informational purposes.
