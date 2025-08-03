const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Test configuration
const GITHUB_PAGES_URL = 'https://gma3561.github.io/the-realty-itemlist-dashboard/';
const EXPECTED_DASHBOARD_URL = 'https://gma3561.github.io/the-realty-itemlist-dashboard/#/dashboard';
const WRONG_URL_PATTERN = 'https://gma3561.github.io/#/';

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'test-results', 'github-pages-bypass-test');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Test results storage
let testResults = {
  testStartTime: new Date().toISOString(),
  baseUrl: GITHUB_PAGES_URL,
  expectedDashboardUrl: EXPECTED_DASHBOARD_URL,
  testCases: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Helper function to add test result
function addTestResult(name, status, details, screenshot = null, actualUrl = null) {
  const result = {
    name,
    status,
    details,
    timestamp: new Date().toISOString(),
    screenshot,
    actualUrl
  };
  
  testResults.testCases.push(result);
  testResults.summary.total++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
  } else if (status === 'FAIL') {
    testResults.summary.failed++;
  } else if (status === 'WARNING') {
    testResults.summary.warnings++;
  }
  
  console.log(`[${status}] ${name}: ${details}`);
  if (actualUrl) {
    console.log(`  URL: ${actualUrl}`);
  }
}

// Helper function to wait for navigation and verify URL
async function verifyNavigation(page, expectedUrl, buttonName) {
  try {
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const currentUrl = page.url();
    
    if (currentUrl === expectedUrl) {
      addTestResult(
        `${buttonName} Button URL Verification`,
        'PASS',
        `Correctly redirected to dashboard URL`,
        null,
        currentUrl
      );
      return true;
    } else if (currentUrl.includes(WRONG_URL_PATTERN)) {
      addTestResult(
        `${buttonName} Button URL Verification`,
        'FAIL',
        `Redirected to wrong URL - shows base path issue not fixed`,
        null,
        currentUrl
      );
      return false;
    } else {
      addTestResult(
        `${buttonName} Button URL Verification`,
        'WARNING',
        `Redirected to unexpected URL`,
        null,
        currentUrl
      );
      return false;
    }
  } catch (error) {
    addTestResult(
      `${buttonName} Button URL Verification`,
      'FAIL',
      `Navigation error: ${error.message}`,
      null,
      page.url()
    );
    return false;
  }
}

test.describe('GitHub Pages Bypass Login Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('Comprehensive Bypass Login Testing', async ({ page }) => {
    console.log('Starting GitHub Pages Bypass Login Fix Verification...');
    console.log(`Target URL: ${GITHUB_PAGES_URL}`);
    console.log(`Expected Dashboard URL: ${EXPECTED_DASHBOARD_URL}`);
    
    try {
      // Test Case 1: Navigate to GitHub Pages URL
      console.log('\n=== TEST CASE 1: Initial Page Load ===');
      await page.goto(GITHUB_PAGES_URL, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Take screenshot of initial page
      const initialScreenshot = path.join(screenshotsDir, '01-initial-page-load.png');
      await page.screenshot({ path: initialScreenshot, fullPage: true });
      
      addTestResult(
        'Initial Page Load',
        'PASS',
        'Successfully loaded GitHub Pages URL',
        '01-initial-page-load.png',
        page.url()
      );

      // Test Case 2: Verify login page elements
      console.log('\n=== TEST CASE 2: Login Page Elements ===');
      
      // Check for bypass login buttons
      const adminButton = page.locator('button:has-text("Admin으로 입장")');
      const ownerButton = page.locator('button:has-text("Owner로 입장")');
      const staffButton = page.locator('button:has-text("Staff로 입장")');
      
      const adminExists = await adminButton.count() > 0;
      const ownerExists = await ownerButton.count() > 0;
      const staffExists = await staffButton.count() > 0;
      
      if (adminExists && ownerExists && staffExists) {
        addTestResult(
          'Bypass Login Buttons Presence',
          'PASS',
          'All three bypass login buttons found (Admin, Owner, Staff)'
        );
      } else {
        addTestResult(
          'Bypass Login Buttons Presence',
          'FAIL',
          `Missing buttons - Admin: ${adminExists}, Owner: ${ownerExists}, Staff: ${staffExists}`
        );
      }

      // Take screenshot of login page with buttons
      const loginPageScreenshot = path.join(screenshotsDir, '02-login-page-with-buttons.png');
      await page.screenshot({ path: loginPageScreenshot, fullPage: true });

      // Test Case 3: Test Admin Button
      console.log('\n=== TEST CASE 3: Admin Button Test ===');
      if (adminExists) {
        await adminButton.click();
        const adminSuccess = await verifyNavigation(page, EXPECTED_DASHBOARD_URL, 'Admin');
        
        if (adminSuccess) {
          // Take screenshot of dashboard after admin login
          const adminDashboardScreenshot = path.join(screenshotsDir, '03-admin-dashboard.png');
          await page.screenshot({ path: adminDashboardScreenshot, fullPage: true });
          
          // Test dashboard functionality
          await testDashboardFunctionality(page, 'Admin');
        }
        
        // Go back to login page for next test
        await page.goto(GITHUB_PAGES_URL, { waitUntil: 'networkidle' });
      }

      // Test Case 4: Test Owner Button
      console.log('\n=== TEST CASE 4: Owner Button Test ===');
      if (ownerExists) {
        const ownerButtonRetry = page.locator('button:has-text("Owner로 입장")');
        await ownerButtonRetry.click();
        const ownerSuccess = await verifyNavigation(page, EXPECTED_DASHBOARD_URL, 'Owner');
        
        if (ownerSuccess) {
          // Take screenshot of dashboard after owner login
          const ownerDashboardScreenshot = path.join(screenshotsDir, '04-owner-dashboard.png');
          await page.screenshot({ path: ownerDashboardScreenshot, fullPage: true });
          
          // Test dashboard functionality
          await testDashboardFunctionality(page, 'Owner');
        }
        
        // Go back to login page for next test
        await page.goto(GITHUB_PAGES_URL, { waitUntil: 'networkidle' });
      }

      // Test Case 5: Test Staff Button
      console.log('\n=== TEST CASE 5: Staff Button Test ===');
      if (staffExists) {
        const staffButtonRetry = page.locator('button:has-text("Staff로 입장")');
        await staffButtonRetry.click();
        const staffSuccess = await verifyNavigation(page, EXPECTED_DASHBOARD_URL, 'Staff');
        
        if (staffSuccess) {
          // Take screenshot of dashboard after staff login
          const staffDashboardScreenshot = path.join(screenshotsDir, '05-staff-dashboard.png');
          await page.screenshot({ path: staffDashboardScreenshot, fullPage: true });
          
          // Test dashboard functionality
          await testDashboardFunctionality(page, 'Staff');
        }
      }

      // Test Case 6: Direct URL Access Test
      console.log('\n=== TEST CASE 6: Direct Dashboard URL Access ===');
      await page.goto(EXPECTED_DASHBOARD_URL, { waitUntil: 'networkidle' });
      
      const directAccessScreenshot = path.join(screenshotsDir, '06-direct-dashboard-access.png');
      await page.screenshot({ path: directAccessScreenshot, fullPage: true });
      
      if (page.url() === EXPECTED_DASHBOARD_URL) {
        addTestResult(
          'Direct Dashboard URL Access',
          'PASS',
          'Dashboard accessible via direct URL with correct base path',
          '06-direct-dashboard-access.png',
          page.url()
        );
      } else {
        addTestResult(
          'Direct Dashboard URL Access',
          'WARNING',
          'Dashboard URL changed after direct access',
          '06-direct-dashboard-access.png',
          page.url()
        );
      }

    } catch (error) {
      console.error('Critical test error:', error);
      addTestResult(
        'Critical Test Error',
        'FAIL',
        `Unexpected error during testing: ${error.message}`
      );
    }

    // Generate final test report
    await generateTestReport();
  });

  // Helper function to test dashboard functionality
  async function testDashboardFunctionality(page, userType) {
    console.log(`\n=== Testing Dashboard Functionality for ${userType} ===`);
    
    try {
      // Wait for dashboard to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Check for dashboard elements
      const dashboardTitle = page.locator('h1, .dashboard-title, [data-testid="dashboard-title"]');
      const navigationMenu = page.locator('nav, .navigation, .sidebar');
      
      const titleExists = await dashboardTitle.count() > 0;
      const navExists = await navigationMenu.count() > 0;
      
      if (titleExists || navExists) {
        addTestResult(
          `Dashboard Load - ${userType}`,
          'PASS',
          'Dashboard elements loaded successfully'
        );
      } else {
        addTestResult(
          `Dashboard Load - ${userType}`,
          'WARNING',
          'Dashboard loaded but key elements not found'
        );
      }
      
      // Test navigation if available
      const navLinks = page.locator('a[href*="#/"], button[data-route]');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        addTestResult(
          `Dashboard Navigation - ${userType}`,
          'PASS',
          `Found ${linkCount} navigation elements`
        );
        
        // Test first navigation link if available
        const firstLink = navLinks.first();
        const linkText = await firstLink.textContent();
        
        if (linkText) {
          await firstLink.click();
          await page.waitForLoadState('networkidle', { timeout: 5000 });
          
          const newUrl = page.url();
          if (newUrl.includes('gma3561.github.io/the-realty-itemlist-dashboard')) {
            addTestResult(
              `Navigation Test - ${userType}`,
              'PASS',
              `Navigation to "${linkText}" maintains correct base path`
            );
          } else {
            addTestResult(
              `Navigation Test - ${userType}`,
              'WARNING',
              `Navigation to "${linkText}" resulted in unexpected URL: ${newUrl}`
            );
          }
        }
      } else {
        addTestResult(
          `Dashboard Navigation - ${userType}`,
          'WARNING',
          'No navigation elements found in dashboard'
        );
      }
      
    } catch (error) {
      addTestResult(
        `Dashboard Functionality - ${userType}`,
        'FAIL',
        `Error testing dashboard: ${error.message}`
      );
    }
  }

  // Helper function to generate test report
  async function generateTestReport() {
    testResults.testEndTime = new Date().toISOString();
    testResults.duration = new Date(testResults.testEndTime) - new Date(testResults.testStartTime);
    
    const reportPath = path.join(screenshotsDir, 'github-pages-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    
    // Generate HTML report
    const htmlReport = generateHtmlReport();
    const htmlReportPath = path.join(screenshotsDir, 'github-pages-test-report.html');
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Warnings: ${testResults.summary.warnings}`);
    console.log(`\nReports generated:`);
    console.log(`- JSON: ${reportPath}`);
    console.log(`- HTML: ${htmlReportPath}`);
    console.log(`- Screenshots: ${screenshotsDir}`);
  }

  function generateHtmlReport() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub Pages Bypass Login Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; }
        .stat.pass { background: #d4edda; }
        .stat.fail { background: #f8d7da; }
        .stat.warning { background: #fff3cd; }
        .test-case { border: 1px solid #ddd; margin: 10px 0; border-radius: 5px; }
        .test-header { padding: 10px; background: #f8f9fa; font-weight: bold; }
        .test-content { padding: 15px; }
        .status { padding: 3px 8px; border-radius: 3px; color: white; font-size: 12px; }
        .status.PASS { background: #28a745; }
        .status.FAIL { background: #dc3545; }
        .status.WARNING { background: #ffc107; color: black; }
        .url { font-family: monospace; background: #f8f9fa; padding: 5px; border-radius: 3px; word-break: break-all; }
        .screenshot { max-width: 300px; margin: 10px 0; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>GitHub Pages Bypass Login Fix Verification Report</h1>
        <p><strong>Test Date:</strong> ${testResults.testStartTime}</p>
        <p><strong>Target URL:</strong> <span class="url">${testResults.baseUrl}</span></p>
        <p><strong>Expected Dashboard URL:</strong> <span class="url">${testResults.expectedDashboardUrl}</span></p>
        <p><strong>Duration:</strong> ${Math.round(testResults.duration / 1000)} seconds</p>
    </div>

    <div class="summary">
        <div class="stat">
            <div style="font-size: 24px; font-weight: bold;">${testResults.summary.total}</div>
            <div>Total Tests</div>
        </div>
        <div class="stat pass">
            <div style="font-size: 24px; font-weight: bold;">${testResults.summary.passed}</div>
            <div>Passed</div>
        </div>
        <div class="stat fail">
            <div style="font-size: 24px; font-weight: bold;">${testResults.summary.failed}</div>
            <div>Failed</div>
        </div>
        <div class="stat warning">
            <div style="font-size: 24px; font-weight: bold;">${testResults.summary.warnings}</div>
            <div>Warnings</div>
        </div>
    </div>

    <h2>Test Cases</h2>
    ${testResults.testCases.map(testCase => `
        <div class="test-case">
            <div class="test-header">
                <span class="status ${testCase.status}">${testCase.status}</span>
                ${testCase.name}
            </div>
            <div class="test-content">
                <p><strong>Details:</strong> ${testCase.details}</p>
                ${testCase.actualUrl ? `<p><strong>URL:</strong> <span class="url">${testCase.actualUrl}</span></p>` : ''}
                <p><strong>Timestamp:</strong> ${testCase.timestamp}</p>
                ${testCase.screenshot ? `<p><strong>Screenshot:</strong> ${testCase.screenshot}</p>` : ''}
            </div>
        </div>
    `).join('')}

    <h2>Key Findings</h2>
    <div class="test-content">
        <h3>Routing Fix Verification</h3>
        <p>This test specifically verifies that the bypass login buttons redirect to the correct URL with the proper GitHub Pages base path:</p>
        <ul>
            <li><strong>Correct URL:</strong> <span class="url">https://gma3561.github.io/the-realty-itemlist-dashboard/#/dashboard</span></li>
            <li><strong>Wrong URL (old bug):</strong> <span class="url">https://gma3561.github.io/#/</span></li>
        </ul>
        
        <h3>Test Coverage</h3>
        <ul>
            <li>Initial page load verification</li>
            <li>Bypass login button presence check</li>
            <li>URL redirection verification for all three user types</li>
            <li>Dashboard functionality testing</li>
            <li>Navigation within dashboard</li>
            <li>Direct dashboard URL access</li>
        </ul>
    </div>
</body>
</html>
    `;
  }
});