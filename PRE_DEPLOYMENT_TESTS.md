# Pre-Deployment Testing Guide

This document outlines the pre-deployment testing process for the application, designed to catch common issues before deploying to production.

## Overview

The pre-deployment test suite consists of four main tests:

1. **Production Build Test** (Required)
   - Builds the application in production mode
   - Starts a production server on port 3001
   - Tests that key pages load correctly
   - Tests that the vote API works

2. **Broken Links Check** (Optional)
   - Crawls the site to find broken links and 404 errors
   - Generates a report of broken links
   - Some known missing pages are excluded from the report

3. **Vote Integrity Test** (Optional)
   - Tests the basic structure and accessibility of the vote system APIs
   - Checks vote requests and responses

4. **Schema Markup Validation** (Optional)
   - Validates schema.org markup on product pages
   - Checks for proper SEO meta tags
   - Provides examples for correct implementation

## Running the Tests

To run the full test suite:

```bash
npm run precheck
```

To run individual tests:

```bash
node scripts/test-production-build.js
node scripts/check-broken-links.js
node scripts/test-vote-integrity.js
node scripts/validate-schema-markup.js
```

## Interpreting Results

The test suite will provide a summary of results, indicating which tests passed, failed, or produced warnings. A test can be in one of three states:

- **PASSED** ✅ - The test completed successfully
- **FAILED** ❌ - A required test failed, this would block deployment
- **WARNING** ⚠️ - An optional test failed, deployment can still proceed

The test suite will exit with code 0 if all required tests pass, and code 1 if any required tests fail.

## Test Reports

The test suite generates several report files:

- `pre-deploy-test-report-{timestamp}.json` - Overall test results
- `production-test-report-{timestamp}.json` - Production build test results
- `broken-links-report-{timestamp}.json` - Broken links check results
- `schema-validation-report-{timestamp}.json` - Schema markup validation results

These reports can be useful for understanding what failed and why.

## Troubleshooting Common Issues

### Production Build Test

- **Server not starting**: Check for port conflicts (3001 is used by default)
- **Page load errors**: Check for runtime errors in the browser console
- **Vote API errors**: Check that the vote API is properly configured

### Broken Links Check

- **Many 404 errors**: Some pages might genuinely be missing or might need to be excluded in the test script
- **Timeouts**: The site might be too slow to crawl, try increasing the timeout in the script

### Vote Integrity Test

- **API accessibility failures**: The vote APIs might be temporarily unavailable
- **Database connection errors**: Check Supabase connection settings

### Schema Markup Validation

- **Missing schema.org markup**: Add proper JSON-LD markup to product pages
- **Missing meta tags**: Add OpenGraph meta tags for better SEO

## Customizing the Tests

The test scripts can be customized to fit specific project needs:

- `scripts/test-production-build.js`: Modify `PAGES_TO_TEST` to test different pages
- `scripts/check-broken-links.js`: Update `shouldCrawl` function to exclude specific paths
- `scripts/test-vote-integrity.js`: Adjust test criteria for vote API
- `scripts/validate-schema-markup.js`: Change validation requirements for schema markup

## Required vs. Optional Tests

Tests are marked as required or optional in `scripts/run-pre-deploy-tests.js`. By default:

- **Required**: Production Build Test
- **Optional**: Broken Links Check, Vote Integrity Test, Schema Markup Validation

You can change which tests are required by modifying the `required` property in the `TESTS` array.

## Continuous Integration

To run these tests in a CI environment:

```yaml
# Example GitHub Actions workflow
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run precheck
```

## Adding New Tests

To add a new test to the suite:

1. Create a new test script in the `scripts/` directory
2. Add the test to the `TESTS` array in `scripts/run-pre-deploy-tests.js`
3. Update this documentation to include the new test

## Notes for Future Enhancements

Future improvements to consider for the test suite:

1. Add component-level tests for specific UI elements
2. Add more comprehensive API tests
3. Add performance testing
4. Add accessibility testing
5. Add cross-browser compatibility testing 