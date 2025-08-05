# Playwright E2E Tests

This directory contains end-to-end tests for the Real Estate Dashboard using Playwright.

## Setup

1. **Install Playwright VS Code Extension**
   - Open VS Code
   - Go to Extensions (Cmd+Shift+X)
   - Search for "Playwright Test for VSCode"
   - Install the official Microsoft extension

2. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

## Running Tests

### From Command Line

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

### From VS Code

1. Open the Testing sidebar (flask icon)
2. You'll see all test files listed
3. Click the play button next to any test to run it
4. Click "Run All Tests" to run everything

### VS Code Features

- **Run tests from editor**: Click the green play button in the gutter next to any test
- **Debug tests**: Right-click on a test and select "Debug Test"
- **Pick locators**: Use the "Pick locator" button in the Playwright panel
- **Record new tests**: Use the "Record new" button to generate test code

## Test Structure

- `auth.spec.js` - Authentication flow tests
- `dashboard.spec.js` - Dashboard functionality tests  
- `properties.spec.js` - Property management tests
- `fixtures/auth.js` - Custom fixtures for authenticated tests

## Bypass Login

Tests use the bypass login feature for authentication. This only works in development environment (localhost).

Three user types are available:
- **Admin**: Full access to all features
- **User**: Limited access, can only see own properties
- **Manager**: Special permissions (customize as needed)

## Writing New Tests

### Basic Test
```javascript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### Authenticated Test
```javascript
import { test, expect } from './fixtures/auth';

test('admin test', async ({ adminPage }) => {
  // adminPage is already logged in as admin
  await expect(adminPage.locator('h1')).toContainText('Dashboard');
});
```

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for elements** before interacting: `await page.waitForSelector()`
3. **Use fixtures** for common setup like authentication
4. **Keep tests independent** - each test should work in isolation
5. **Use descriptive test names** that explain what is being tested

## Troubleshooting

- **Tests timing out**: Increase timeout in playwright.config.js
- **Can't find elements**: Use the Playwright Inspector to pick selectors
- **Bypass login not working**: Make sure VITE_ENABLE_BYPASS=true in .env.development
- **Browser not installed**: Run `npx playwright install`

## VS Code Tips

- Use Cmd+Shift+P and search for "Playwright" to see all available commands
- The Playwright panel shows test results and allows picking locators
- Enable "Show browser" in the Playwright panel to see tests run
- Use the trace viewer to debug failed tests