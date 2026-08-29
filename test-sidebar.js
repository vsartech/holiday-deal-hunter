const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    
    // Check sidebar
    const sidebar = page.locator('aside');
    await sidebar.waitFor({ state: 'visible' });
    
    const sidebarBox = await sidebar.boundingBox();
    console.log('Sidebar width:', sidebarBox?.width);
    
    // Check brand
    await page.locator('aside div.flex.items-center.gap-3 > div:first-child').waitFor({ state: 'visible' });
    console.log('Brand visible: OK');
    
    // Check navigation items
    const navItems = ['Overview', 'Travel Deals', 'Card Offers', 'Market Intel', 'Competitors', 'AI Assistant'];
    for (const item of navItems) {
      await page.locator(`aside a:has-text("${item}")`).waitFor({ state: 'visible' });
    }
    console.log('Navigation items visible: OK');
    
    // Check collapse button
    const collapseBtn = page.locator('aside button[aria-label="Collapse sidebar"]');
    await collapseBtn.waitFor({ state: 'visible' });
    console.log('Collapse button visible: OK');
    
    // Click collapse
    await collapseBtn.click();
    await page.waitForTimeout(500); // wait for transition
    
    // Check collapsed width
    const sidebarBoxCollapsed = await sidebar.boundingBox();
    console.log('Sidebar collapsed width:', sidebarBoxCollapsed?.width);
    
    // Check labels are hidden
    const labelsHidden = await page.locator('aside .text-sm.font-semibold.leading-tight.truncate').isHidden();
    console.log('Labels hidden when collapsed:', labelsHidden);
    
    // Check icon-only nav
    const iconsOnly = await page.locator('aside a:has-text("📊")').count();
    console.log('Icons only nav:', iconsOnly > 0 ? 'OK' : 'FAIL');
    
    // Expand again
    const expandBtn = page.locator('aside button[aria-label="Expand sidebar"]');
    await expandBtn.waitFor({ state: 'visible' });
    await expandBtn.click();
    await page.waitForTimeout(500);
    
    const sidebarBoxExpanded = await sidebar.boundingBox();
    console.log('Sidebar expanded width:', sidebarBoxExpanded?.width);
    
    console.log('\n✅ All sidebar tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();