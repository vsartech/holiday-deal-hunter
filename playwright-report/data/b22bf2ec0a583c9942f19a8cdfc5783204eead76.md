# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-verification.spec.ts >> UI Layout Verification >> Overview page - Sidebar visible and navigation works
- Location: tests/ui-verification.spec.ts:9:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3004/
Call log:
  - navigating to "http://localhost:3004/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('UI Layout Verification', () => {
  4   |   test.beforeEach(async ({ page }) => {
> 5   |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3004/
  6   |     await page.waitForLoadState('networkidle');
  7   |   });
  8   | 
  9   |   test('Overview page - Sidebar visible and navigation works', async ({ page }) => {
  10  |     const sidebar = page.locator('aside');
  11  |     await expect(sidebar).toBeVisible();
  12  | 
  13  |     const sidebarBox = await sidebar.boundingBox();
  14  |     expect(sidebarBox?.width).toBeCloseTo(240, 10);
  15  | 
  16  |     // Check brand
  17  |     await expect(page.locator('aside div.flex.items-center.gap-3 > div:first-child')).toBeVisible();
  18  |     await expect(page.locator('aside .text-xs.text-gray-400.leading-tight')).toBeVisible();
  19  | 
  20  |     const navItems = ['Overview', 'Travel Deals', 'Card Offers', 'Market Intel', 'Competitors', 'AI Assistant'];
  21  |     for (const item of navItems) {
  22  |       await expect(page.locator(`aside a:has-text("${item}")`)).toBeVisible();
  23  |     }
  24  |   });
  25  | 
  26  |   test('Overview page - Stat cards present', async ({ page }) => {
  27  |     // Check all 8 stat cards have their labels
  28  |     const labels = ['Travel Deals', 'Card Offers', 'Market Signals', 'Competitors', 'Cheapest Deal', 'Avg Deal Price', 'Data Sources', 'Destinations'];
  29  |     for (const label of labels) {
  30  |       await expect(page.locator(`main p:has-text("${label}")`).first()).toBeVisible();
  31  |     }
  32  |   });
  33  | 
  34  |   test('Overview page - Charts rendered', async ({ page }) => {
  35  |     await expect(page.locator('text=Deals by Destination')).toBeVisible();
  36  |     await expect(page.locator('text=Price Distribution by Destination')).toBeVisible();
  37  |     await expect(page.locator('text=Deals by Type')).toBeVisible();
  38  |     await expect(page.locator('text=Offers by Source')).toBeVisible();
  39  |   });
  40  | 
  41  |   test('Overview page - Top 5 cheapest deals section', async ({ page }) => {
  42  |     await expect(page.locator('h3:has-text("Top 5 Cheapest Deals")')).toBeVisible();
  43  |   });
  44  | 
  45  |   test('Overview page - Data Sources section', async ({ page }) => {
  46  |     await expect(page.locator('h3:has-text("Data Sources")')).toBeVisible();
  47  |     const badges = page.locator('.badge');
  48  |     await expect(badges.first()).toBeVisible();
  49  |   });
  50  | 
  51  |   test('Deals page - Navigation and filters', async ({ page }) => {
  52  |     await page.click('aside a:has-text("Travel Deals")');
  53  |     await page.waitForLoadState('networkidle');
  54  | 
  55  |     await expect(page.locator('main h1:has-text("Travel Deals")')).toBeVisible();
  56  |     await expect(page.locator('main select')).toHaveCount(3);
  57  |     await expect(page.locator('main table')).toBeVisible();
  58  |   });
  59  | 
  60  |   test('Deals page - Table rows clickable and modal opens', async ({ page }) => {
  61  |     await page.goto('/deals');
  62  |     await page.waitForLoadState('networkidle');
  63  |     await page.waitForSelector('tbody tr');
  64  | 
  65  |     await page.locator('tbody tr').first().click();
  66  |     await expect(page.locator('.modal-backdrop')).toBeVisible();
  67  |     await expect(page.locator('.modal-panel')).toBeVisible();
  68  |     await expect(page.locator('.modal-panel h3')).toBeVisible();
  69  | 
  70  |     await page.click('.modal-backdrop >> button');
  71  |     await expect(page.locator('.modal-backdrop')).not.toBeVisible();
  72  |   });
  73  | 
  74  |   test('Deals page - Pagination works', async ({ page }) => {
  75  |     await page.goto('/deals');
  76  |     await page.waitForLoadState('networkidle');
  77  |     await expect(page.locator('main').getByText('Page')).toBeVisible();
  78  |   });
  79  | 
  80  |   test('Card Offers page - Layout and filters', async ({ page }) => {
  81  |     await page.click('aside a:has-text("Card Offers")');
  82  |     await page.waitForLoadState('networkidle');
  83  | 
  84  |     await expect(page.locator('main h1:has-text("Card Offers")')).toBeVisible();
  85  |     await expect(page.locator('main select')).toHaveCount(2);
  86  |     await expect(page.locator('main table')).toBeVisible();
  87  |     await expect(page.locator('text=Offers by Type')).toBeVisible();
  88  |     await expect(page.locator('text=Offers by Bank')).toBeVisible();
  89  |   });
  90  | 
  91  |   test('Card Offers page - Modal shows offer details', async ({ page }) => {
  92  |     await page.goto('/offers');
  93  |     await page.waitForLoadState('networkidle');
  94  |     await page.waitForSelector('tbody tr');
  95  | 
  96  |     await page.locator('tbody tr').first().click();
  97  |     await expect(page.locator('.modal-backdrop')).toBeVisible();
  98  |     await expect(page.locator('.modal-panel h3')).toBeVisible();
  99  | 
  100 |     // Check for key detail sections in modal
  101 |     await expect(page.locator('.modal-panel').getByText('Bank').first()).toBeVisible();
  102 |     await expect(page.locator('.modal-panel').getByText('Platforms').first()).toBeVisible();
  103 |     await expect(page.locator('.modal-panel').getByText('Applicable For').first()).toBeVisible();
  104 | 
  105 |     await page.click('.modal-backdrop >> button');
```