# Contributing to Warframe Market Analytics

Thank you for your interest in contributing to Warframe Market Analytics! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- Be respectful and inclusive
- Be constructive in discussions
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn
- Git

### First Contribution

1. Look for issues labeled `good first issue` or `help wanted`
2. Comment on the issue to let others know you're working on it
3. Fork the repository
4. Follow the development setup guide

## Development Setup

1. **Clone your fork:**
   ```bash
   git clone https://github.com/yourusername/warframe-market-analytics.git
   cd warframe-market-analytics
   ```

2. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/originalowner/warframe-market-analytics.git
   ```

3. **Run setup script:**
   ```bash
   # Linux/macOS
   chmod +x setup.sh
   ./setup.sh
   
   # Windows
   setup.bat
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Start development servers:**
   ```bash
   # Terminal 1 - Backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd app
   npm run dev
   ```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-price-alerts`
- `bugfix/fix-database-connection`
- `docs/update-api-documentation`
- `refactor/improve-error-handling`

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(api): add real-time price alerts`
- `fix(database): resolve connection timeout issues`
- `docs(readme): update installation instructions`
- `refactor(proxy): improve error handling`

### Code Changes

1. **Create a new branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation as needed
   - Follow the style guidelines

3. **Test your changes:**
   ```bash
   npm run build
   npm test
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat(api): add new feature"
   ```

## Submitting Changes

### Pull Request Process

1. **Update your branch:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request:**
   - Go to GitHub and create a new pull request
   - Use a clear, descriptive title
   - Include a detailed description of changes
   - Link any related issues
   - Add screenshots for UI changes

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings/errors
```

## Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Prefer async/await over promises
- Use proper error handling

Example:
```typescript
/**
 * Fetches market data for a specific item
 * @param itemId - The unique identifier for the item
 * @returns Promise containing market data
 */
async function getMarketData(itemId: string): Promise<MarketData> {
  try {
    const response = await api.get(`/items/${itemId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch market data for ${itemId}:`, error);
    throw new Error(`Market data unavailable for item ${itemId}`);
  }
}
```

### Vue.js Components

- Use single-file components (.vue)
- Follow Vue.js style guide
- Use TypeScript in script sections
- Add proper prop validation
- Use meaningful component names

Example:
```vue
<template>
  <div class="market-item">
    <h3>{{ item.name }}</h3>
    <p>Price: {{ formatPrice(item.price) }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@nuxtjs/composition-api'
import { MarketItem } from '~/types'

export default defineComponent({
  name: 'MarketItemCard',
  props: {
    item: {
      type: Object as PropType<MarketItem>,
      required: true
    }
  },
  setup() {
    const formatPrice = (price: number): string => {
      return `${price} platinum`
    }

    return {
      formatPrice
    }
  }
})
</script>
```

### Database Models

- Use proper TypeScript interfaces
- Add validation where appropriate
- Document schema fields
- Use meaningful collection names

Example:
```typescript
interface MarketItem {
  id: string;
  item_name: string;
  url_name: string;
  thumb: string;
  vaulted?: boolean;
  market?: {
    buy_price: number;
    sell_price: number;
    volume: number;
    last_updated: Date;
  };
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --grep "market data"

# Run tests in watch mode
npm test -- --watch
```

### Writing Tests

- Write tests for all new functionality
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies

Example:
```typescript
describe('MarketDataService', () => {
  describe('getItemPrice', () => {
    it('should return price data for valid item', async () => {
      const mockItem = { id: '123', url_name: 'test-item' };
      const result = await service.getItemPrice(mockItem);
      
      expect(result).toHaveProperty('buy_price');
      expect(result).toHaveProperty('sell_price');
      expect(result.buy_price).toBeGreaterThan(0);
    });

    it('should throw error for invalid item', async () => {
      const invalidItem = { id: '', url_name: '' };
      
      await expect(service.getItemPrice(invalidItem))
        .rejects.toThrow('Invalid item data');
    });
  });
});
```

## Documentation

### Code Documentation

- Use JSDoc for TypeScript functions
- Document complex algorithms
- Add inline comments for non-obvious code
- Keep comments up to date

### API Documentation

- Document all API endpoints
- Include request/response examples
- Document error responses
- Use OpenAPI/Swagger when possible

### README Updates

- Update installation instructions for new dependencies
- Document new configuration options
- Add examples for new features
- Keep troubleshooting section current

## Project Structure

```
warframe/
├── Express/           # Backend API framework
├── app/              # Frontend Nuxt.js application
├── proxies/          # Proxy configuration
├── database.ts       # Database connection and models
├── warframe.ts       # Core API client
├── sync_*.ts         # Data synchronization scripts
├── *.interface.ts    # TypeScript interfaces
└── tests/           # Test files
```

## Getting Help

### Questions and Discussion

- Open a GitHub Discussion for general questions
- Use Discord/Slack for real-time chat (if available)
- Check existing issues and documentation first

### Reporting Bugs

1. Search existing issues first
2. Use the bug report template
3. Include reproduction steps
4. Add relevant logs/screenshots
5. Specify your environment details

### Feature Requests

1. Check if feature already exists or is planned
2. Use the feature request template
3. Explain the use case and benefit
4. Provide detailed requirements
5. Consider implementation complexity

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Git tag created
- [ ] Release notes written

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- Project documentation

Thank you for contributing to Warframe Market Analytics! 🚀
