# Dashboard E2E Tests

This directory contains end-to-end tests for the owner dashboard functionality.

## Test Files

### campsite-create.test.ts

Comprehensive E2E tests for the campsite creation wizard flow.

**Total Tests: 38**

#### Test Categories

##### 1. Wizard Navigation (8 tests)
Tests the multi-step wizard interface and step transitions.

- **T060.1-T060.6**: Step progression and field visibility
- **T060.7**: Back button navigation
- **T060.8**: Progress indicator visual states

##### 2. Form Validation (8 tests)
Tests client-side validation for all wizard steps.

- **T060.9**: Required fields prevent progression
- **T060.10-T060.11**: Text field length validation
- **T060.12**: Location step required fields
- **T060.13-T060.14**: GPS coordinates range validation
- **T060.15**: Photo upload file type validation
- **T060.16**: Error message display and accessibility

##### 3. Data Persistence (4 tests)
Tests that form data is preserved across wizard navigation.

##### 4. Successful Creation (5 tests)
Tests the successful campsite creation flow.

##### 5. Error Handling (5 tests)
Tests error scenarios and recovery.

##### 6. UI/UX Features (8 tests)
Tests user interface elements and user experience features.

## Running Tests

```bash
# Run all dashboard tests
pnpm exec playwright test tests/e2e/dashboard/

# Run only campsite creation tests
pnpm exec playwright test tests/e2e/dashboard/campsite-create.test.ts

# Run specific category
pnpm exec playwright test tests/e2e/dashboard/campsite-create.test.ts -g "Form Validation"

# Debug mode
pnpm exec playwright test tests/e2e/dashboard/campsite-create.test.ts --debug
```
