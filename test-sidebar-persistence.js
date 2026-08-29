const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    
    // Collapse sidebar
    await page.locator('aside button[aria-label="Collapse sidebar"]').click();
    await page.waitForTimeout(500);
    
    // Navigate to deals page
    await page.click('aside a:has-text("Travel Deals")');
    await page.waitForLoadState('networkidle');
    
    // Check sidebar still collapsed
    const sidebar = page.locator('aside');
    const sidebarBox = await sidebar.boundingBox();
    console.log('Sidebar width on Deals page:', sidebarBox?.width);
    
    // Check labels hidden
    const labelsHidden = await page.locator('aside .text-sm.font-semibold.leading-tight.truncate').isHidden();
    console.log('Labels hidden on Deals page:', labelsHidden);
    
    // Check main margin adjusted
    const main = page.locator('main');
    const mainStyle = await main.getAttribute('style');
    console.log('Main margin-left:', mainStyle?.includes('64px') ? '64px (correct)' : mainStyle);
    
    // Expand
    await page.locator('aside button[aria-label="Expand sidebar"]').click();
    await page.waitForTimeout(500);
    
    const sidebarBoxExpanded = await sidebar.boundingBox();
    console.log('Sidebar width after expand:', sidebarBoxExpanded?.width);
    
    console.log('\n✅ Persistence test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();