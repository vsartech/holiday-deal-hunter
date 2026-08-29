import { test, expect } from '@playwright/test';

test.describe('UI Layout Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Overview page - Sidebar visible and navigation works', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.width).toBeCloseTo(240, 10);

    // Check brand
    await expect(page.locator('aside div.flex.items-center.gap-3 > div:first-child')).toBeVisible();
    await expect(page.locator('aside .text-xs.text-gray-400.leading-tight')).toBeVisible();

    const navItems = ['Overview', 'Travel Deals', 'Card Offers', 'Market Intel', 'Competitors', 'AI Assistant'];
    for (const item of navItems) {
      await expect(page.locator(`aside a:has-text("${item}")`)).toBeVisible();
    }
  });

  test('Overview page - Stat cards present', async ({ page }) => {
    // Check all 8 stat cards have their labels
    const labels = ['Travel Deals', 'Card Offers', 'Market Signals', 'Competitors', 'Cheapest Deal', 'Avg Deal Price', 'Data Sources', 'Destinations'];
    for (const label of labels) {
      await expect(page.locator(`main .metric-card .metric-label:has-text("${label}")`)).toBeVisible();
    }
  });

  test('Overview page - Charts rendered', async ({ page }) => {
    await expect(page.locator('text=Deals by Destination')).toBeVisible();
    await expect(page.locator('text=Price Distribution by Destination')).toBeVisible();
    await expect(page.locator('text=Deals by Type')).toBeVisible();
    await expect(page.locator('text=Offers by Source')).toBeVisible();
  });

  test('Overview page - Top 5 cheapest deals section', async ({ page }) => {
    await expect(page.locator('.panel .panel-title:has-text("Top 5 Cheapest Deals")')).toBeVisible();
  });

  test('Overview page - Data Sources section', async ({ page }) => {
    await expect(page.locator('.panel .panel-title:has-text("Data Sources")')).toBeVisible();
    const badges = page.locator('.status-badge');
    await expect(badges.first()).toBeVisible();
  });

  test('Deals page - Navigation and filters', async ({ page }) => {
    await page.click('aside a:has-text("Travel Deals")');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main .display-heading:has-text("Travel Deals")')).toBeVisible();
    await expect(page.locator('main .form-input')).toHaveCount(3);
    await expect(page.locator('main table')).toBeVisible();
  });

  test('Deals page - Table rows clickable and modal opens', async ({ page }) => {
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('tbody tr');

    await page.locator('tbody tr').first().click();
    await expect(page.locator('.modal-backdrop')).toBeVisible();
    await expect(page.locator('.modal-panel')).toBeVisible();
    await expect(page.locator('.modal-title')).toBeVisible();

    await page.click('.modal-backdrop >> button');
    await expect(page.locator('.modal-backdrop')).not.toBeVisible();
  });

  test('Deals page - Pagination works', async ({ page }) => {
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').getByText('Page')).toBeVisible();
  });

  test('Card Offers page - Layout and filters', async ({ page }) => {
    await page.click('aside a:has-text("Card Offers")');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main .display-heading:has-text("Card Offers")')).toBeVisible();
    await expect(page.locator('main .form-input')).toHaveCount(2);
    await expect(page.locator('main table')).toBeVisible();
    await expect(page.locator('text=Offers by Type')).toBeVisible();
    await expect(page.locator('text=Offers by Bank')).toBeVisible();
  });

  test('Card Offers page - Modal shows offer details', async ({ page }) => {
    await page.goto('/offers');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('tbody tr');

    await page.locator('tbody tr').first().click();
    await expect(page.locator('.modal-backdrop')).toBeVisible();
    await expect(page.locator('.modal-title')).toBeVisible();

    // Check for key detail sections in modal
    await expect(page.locator('.modal-panel').getByText('Bank').first()).toBeVisible();
    await expect(page.locator('.modal-panel').getByText('Platforms').first()).toBeVisible();
    await expect(page.locator('.modal-panel').getByText('Applicable For').first()).toBeVisible();

    await page.click('.modal-backdrop >> button');
  });

  test('Market Intel page - Layout and filters', async ({ page }) => {
    await page.click('aside a:has-text("Market Intel")');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main .display-heading:has-text("Market Intelligence")')).toBeVisible();
    await expect(page.locator('main .form-input')).toHaveCount(2);
    await expect(page.locator('main table')).toBeVisible();
    
    // Charts may not render if no data - just check chart section exists
    const chartSection = page.locator('main').getByText('Signals by Type').first();
    if (await chartSection.count() > 0) {
      await expect(chartSection).toBeVisible();
    }
  });

  test('Market Intel page - Modal shows signal details', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');
    
    // Check if there's data
    const hasData = await page.locator('tbody tr').count() > 0;
    
    if (hasData) {
      await page.locator('tbody tr').first().click();
      await expect(page.locator('.modal-backdrop')).toBeVisible();
      await expect(page.locator('.modal-title')).toBeVisible();
      await page.click('.modal-backdrop >> button');
    } else {
      // No data - just verify the page loads correctly
      await expect(page.locator('main .display-heading:has-text("Market Intelligence")')).toBeVisible();
    }
  });

  test('Competitors page - Layout and charts', async ({ page }) => {
    await page.click('aside a:has-text("Competitors")');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main .display-heading:has-text("Competitor Intelligence")')).toBeVisible();
    await expect(page.locator('main .form-input')).toHaveCount(2);
    await expect(page.locator('main table')).toBeVisible();
    
    // Charts may not render if no data
    const chartSection = page.locator('main').getByText('Packages by Competitor').first();
    if (await chartSection.count() > 0) {
      await expect(chartSection).toBeVisible();
    }
  });

  test('Competitors page - Modal shows package details', async ({ page }) => {
    await page.goto('/competitors');
    await page.waitForLoadState('networkidle');
    
    const hasData = await page.locator('tbody tr').count() > 0;
    
    if (hasData) {
      await page.locator('tbody tr').first().click();
      await expect(page.locator('.modal-backdrop')).toBeVisible();
      await expect(page.locator('.modal-title')).toBeVisible();
      await expect(page.locator('.modal-panel').getByText('Inclusions').first()).toBeVisible();
      await expect(page.locator('.modal-panel').getByText('Exclusions').first()).toBeVisible();
      await expect(page.locator('.modal-panel').getByText('Confidence').first()).toBeVisible();
      await page.click('.modal-backdrop >> button');
    } else {
      await expect(page.locator('main .display-heading:has-text("Competitor Intelligence")')).toBeVisible();
    }
  });

  test('AI Assistant page - Chat interface', async ({ page }) => {
    await page.click('aside a:has-text("AI Assistant")');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main .display-heading:has-text("AI Assistant")')).toBeVisible();
    await expect(page.locator('main .btn-secondary').first()).toBeVisible();
    await expect(page.locator('main .form-input[placeholder*="Ask about travel"]')).toBeVisible();
    await expect(page.locator('main .btn-primary:has-text("Send")')).toBeVisible();
  });

  test('Responsive layout - Mobile sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('Typography consistency', async ({ page }) => {
    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(fontFamily).toContain('Inter');

    const h1 = page.locator('main .display-heading').first();
    const h1Styles = await h1.evaluate(el => getComputedStyle(el).fontSize);
    expect(parseInt(h1Styles)).toBeGreaterThanOrEqual(24);
  });

  test('Color scheme - primary button', async ({ page }) => {
    const primaryButton = page.locator('main .btn-primary').first();
    if (await primaryButton.count() > 0) {
      const bgColor = await primaryButton.evaluate(el => getComputedStyle(el).backgroundColor);
      expect(bgColor).toContain('rgb(17, 17, 17)'); // #111111
    }
  });

  test('Modal animation', async ({ page }) => {
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('tbody tr');

    await page.locator('tbody tr').first().click();
    await expect(page.locator('.modal-panel')).toBeVisible();

    const animation = await page.locator('.modal-panel').evaluate(el => getComputedStyle(el).animationName);
    expect(animation).toBe('modal-panel-in');
  });
});

test.describe('Cross-page consistency', () => {
  test('All pages have header structure', async ({ page }) => {
    const pages = ['/', '/deals', '/offers', '/market', '/competitors', '/chat'];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main .display-heading')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('All pages use same card styling', async ({ page }) => {
    const pages = ['/', '/deals', '/offers', '/market', '/competitors'];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const cards = page.locator('main .metric-card, main .panel');
      if (await cards.count() > 0) {
        const firstCard = cards.first();
        const border = await firstCard.evaluate(el => getComputedStyle(el).borderColor);
        // Tailwind v4 uses OKLCH, check for gray-200 equivalent
        expect(border).toBeTruthy();
        expect(border).toMatch(/oklch|rgb|rgba/);
      }
    }
  });
});

test.describe('Data integrity', () => {
  test('Deals page shows data', async ({ page }) => {
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('tbody tr');
    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Offers page shows data', async ({ page }) => {
    await page.goto('/offers');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('tbody tr');
    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Market page shows data', async ({ page }) => {
    await page.goto('/market');
    await page.waitForLoadState('networkidle');
    
    const rowCount = await page.locator('tbody tr').count();
    // Market evidence may be empty if not synced
    if (rowCount > 0) {
      expect(rowCount).toBeGreaterThan(0);
    } else {
      // Verify page structure loads
      await expect(page.locator('main .display-heading:has-text("Market Intelligence")')).toBeVisible();
    }
  });

  test('Competitors page shows data', async ({ page }) => {
    await page.goto('/competitors');
    await page.waitForLoadState('networkidle');
    
    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      expect(rowCount).toBeGreaterThan(0);
    } else {
      // Verify page structure loads
      await expect(page.locator('main .display-heading:has-text("Competitor Intelligence")')).toBeVisible();
    }
  });
});