# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-verification.spec.ts >> UI Layout Verification >> AI Assistant page - Chat interface
- Location: tests/ui-verification.spec.ts:175:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main h1:has-text("AI Assistant")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('main h1:has-text("AI Assistant")')

```

```yaml
- complementary:
  - text: HI Holiday Intelligence
  - button "Collapse sidebar": ⟵
  - navigation:
    - text: Navigation
    - list:
      - listitem:
        - link "📊 Overview":
          - /url: /
      - listitem:
        - link "💰 Travel Deals":
          - /url: /deals
      - listitem:
        - link "💳 Card Offers":
          - /url: /offers
      - listitem:
        - link "📈 Market Intel":
          - /url: /market
      - listitem:
        - link "🏢 Competitors":
          - /url: /competitors
      - listitem:
        - link "🤖 AI Assistant":
          - /url: /chat
  - text: Holiday Intelligence v1.0
- main:
  - heading "Overview" [level=1]
  - paragraph: Full pipeline analytics across all data sources
  - paragraph: Travel Deals
  - paragraph: "328"
  - paragraph: 6 destinations
  - text: 💰
  - paragraph: Card Offers
  - paragraph: "128"
  - paragraph: 205 with promo codes
  - text: 💳
  - paragraph: Market Signals
  - paragraph: "0"
  - paragraph: 0 types
  - text: 📈
  - paragraph: Competitors
  - paragraph: "0"
  - paragraph: 0 tracked
  - text: 🏢
  - paragraph: Cheapest Deal
  - paragraph: ₹3,453
  - text: 🎯
  - paragraph: Avg Deal Price
  - paragraph: ₹329,921
  - text: 📊
  - paragraph: Data Sources
  - paragraph: "4"
  - text: 🔗
  - paragraph: Destinations
  - paragraph: "6"
  - text: 🌍
  - heading "Deals by Destination" [level=3]
  - img: Bangkok Dubai Singapore Bali Maldives Goa 0 20 40 60 80
  - heading "Price Distribution by Destination" [level=3]
  - img: Bangkok Dubai Singapore Bali Maldives Goa 0 200000 400000 600000 800000
  - list:
    - listitem:
      - img
      - text: Min
    - listitem:
      - img
      - text: Avg
    - listitem:
      - img
      - text: Max
  - heading "Deals by Type" [level=3]
  - img:
    - img
    - img
    - img
    - text: package 26% hotel 19% flight 56%
  - heading "Offers by Source" [level=3]
  - img: 0 15 30 45 60 coupdunia cleartrip axis_bank grabon goibibo
  - heading "Top 5 Cheapest Deals" [level=3]
  - text: Hotels in Bangkok Bangkok • cleartrip ₹3,453 Hotels in Dubai Dubai • cleartrip ₹3,563 Hotels in Singapore Singapore • cleartrip ₹13,724 Veena World Package Bangkok • veena_world ₹35,000 Veena World Package Dubai • veena_world ₹35,000
  - heading "Data Sources" [level=3]
  - text: kesari 72 cleartrip 208 veena world 6 goibibo 42
- alert
```

# Test source

```ts
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
  106 |   });
  107 | 
  108 |   test('Market Intel page - Layout and filters', async ({ page }) => {
  109 |     await page.click('aside a:has-text("Market Intel")');
  110 |     await page.waitForLoadState('networkidle');
  111 | 
  112 |     await expect(page.locator('main h1:has-text("Market Intelligence")')).toBeVisible();
  113 |     await expect(page.locator('main select')).toHaveCount(2);
  114 |     await expect(page.locator('main table')).toBeVisible();
  115 |     
  116 |     // Charts may not render if no data - just check chart section exists
  117 |     const chartSection = page.locator('main').getByText('Signals by Type').first();
  118 |     if (await chartSection.count() > 0) {
  119 |       await expect(chartSection).toBeVisible();
  120 |     }
  121 |   });
  122 | 
  123 |   test('Market Intel page - Modal shows signal details', async ({ page }) => {
  124 |     await page.goto('/market');
  125 |     await page.waitForLoadState('networkidle');
  126 |     
  127 |     // Check if there's data
  128 |     const hasData = await page.locator('tbody tr').count() > 0;
  129 |     
  130 |     if (hasData) {
  131 |       await page.locator('tbody tr').first().click();
  132 |       await expect(page.locator('.modal-backdrop')).toBeVisible();
  133 |       await expect(page.locator('.modal-panel h3')).toBeVisible();
  134 |       await page.click('.modal-backdrop >> button');
  135 |     } else {
  136 |       // No data - just verify the page loads correctly
  137 |       await expect(page.locator('main h1:has-text("Market Intelligence")')).toBeVisible();
  138 |     }
  139 |   });
  140 | 
  141 |   test('Competitors page - Layout and charts', async ({ page }) => {
  142 |     await page.click('aside a:has-text("Competitors")');
  143 |     await page.waitForLoadState('networkidle');
  144 | 
  145 |     await expect(page.locator('main h1:has-text("Competitor Intelligence")')).toBeVisible();
  146 |     await expect(page.locator('main select')).toHaveCount(2);
  147 |     await expect(page.locator('main table')).toBeVisible();
  148 |     
  149 |     // Charts may not render if no data
  150 |     const chartSection = page.locator('main').getByText('Packages by Competitor').first();
  151 |     if (await chartSection.count() > 0) {
  152 |       await expect(chartSection).toBeVisible();
  153 |     }
  154 |   });
  155 | 
  156 |   test('Competitors page - Modal shows package details', async ({ page }) => {
  157 |     await page.goto('/competitors');
  158 |     await page.waitForLoadState('networkidle');
  159 |     
  160 |     const hasData = await page.locator('tbody tr').count() > 0;
  161 |     
  162 |     if (hasData) {
  163 |       await page.locator('tbody tr').first().click();
  164 |       await expect(page.locator('.modal-backdrop')).toBeVisible();
  165 |       await expect(page.locator('.modal-panel h3')).toBeVisible();
  166 |       await expect(page.locator('.modal-panel').getByText('Inclusions').first()).toBeVisible();
  167 |       await expect(page.locator('.modal-panel').getByText('Exclusions').first()).toBeVisible();
  168 |       await expect(page.locator('.modal-panel').getByText('Confidence').first()).toBeVisible();
  169 |       await page.click('.modal-backdrop >> button');
  170 |     } else {
  171 |       await expect(page.locator('main h1:has-text("Competitor Intelligence")')).toBeVisible();
  172 |     }
  173 |   });
  174 | 
  175 |   test('AI Assistant page - Chat interface', async ({ page }) => {
  176 |     await page.click('aside a:has-text("AI Assistant")');
  177 |     await page.waitForLoadState('networkidle');
  178 | 
> 179 |     await expect(page.locator('main h1:has-text("AI Assistant")')).toBeVisible();
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  180 |     await expect(page.locator('main button[class*="border"]').first()).toBeVisible();
  181 |     await expect(page.locator('main input[placeholder*="Ask about travel"]')).toBeVisible();
  182 |     await expect(page.locator('main button:has-text("Send")')).toBeVisible();
  183 |   });
  184 | 
  185 |   test('Responsive layout - Mobile sidebar', async ({ page }) => {
  186 |     await page.setViewportSize({ width: 375, height: 667 });
  187 |     await expect(page.locator('aside')).toBeVisible();
  188 |     await expect(page.locator('main')).toBeVisible();
  189 |   });
  190 | 
  191 |   test('Typography consistency', async ({ page }) => {
  192 |     const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  193 |     expect(fontFamily).toContain('Inter');
  194 | 
  195 |     const h1 = page.locator('main h1').first();
  196 |     const h1Styles = await h1.evaluate(el => getComputedStyle(el).fontSize);
  197 |     expect(parseInt(h1Styles)).toBeGreaterThanOrEqual(24);
  198 |   });
  199 | 
  200 |   test('Color scheme - primary button', async ({ page }) => {
  201 |     const primaryButton = page.locator('main button.bg-blue-600').first();
  202 |     if (await primaryButton.count() > 0) {
  203 |       const bgColor = await primaryButton.evaluate(el => getComputedStyle(el).backgroundColor);
  204 |       expect(bgColor).toContain('rgb(37, 99, 235)');
  205 |     }
  206 |   });
  207 | 
  208 |   test('Modal animation', async ({ page }) => {
  209 |     await page.goto('/deals');
  210 |     await page.waitForLoadState('networkidle');
  211 |     await page.waitForSelector('tbody tr');
  212 | 
  213 |     await page.locator('tbody tr').first().click();
  214 |     await expect(page.locator('.modal-panel')).toBeVisible();
  215 | 
  216 |     const animation = await page.locator('.modal-panel').evaluate(el => getComputedStyle(el).animationName);
  217 |     expect(animation).toBe('slideUp');
  218 |   });
  219 | });
  220 | 
  221 | test.describe('Cross-page consistency', () => {
  222 |   test('All pages have header structure', async ({ page }) => {
  223 |     const pages = ['/', '/deals', '/offers', '/market', '/competitors', '/chat'];
  224 | 
  225 |     for (const path of pages) {
  226 |       await page.goto(path);
  227 |       await page.waitForLoadState('networkidle');
  228 |       await expect(page.locator('main h1')).toBeVisible();
  229 |       await expect(page.locator('main')).toBeVisible();
  230 |     }
  231 |   });
  232 | 
  233 |   test('All pages use same card styling', async ({ page }) => {
  234 |     const pages = ['/', '/deals', '/offers', '/market', '/competitors'];
  235 | 
  236 |     for (const path of pages) {
  237 |       await page.goto(path);
  238 |       await page.waitForLoadState('networkidle');
  239 | 
  240 |       const cards = page.locator('main .bg-white.rounded-xl.border');
  241 |       if (await cards.count() > 0) {
  242 |         const firstCard = cards.first();
  243 |         const border = await firstCard.evaluate(el => getComputedStyle(el).borderColor);
  244 |         // Tailwind v4 uses OKLCH, check for gray-200 equivalent
  245 |         expect(border).toBeTruthy();
  246 |         expect(border).toMatch(/oklch|rgb|rgba/);
  247 |       }
  248 |     }
  249 |   });
  250 | });
  251 | 
  252 | test.describe('Data integrity', () => {
  253 |   test('Deals page shows data', async ({ page }) => {
  254 |     await page.goto('/deals');
  255 |     await page.waitForLoadState('networkidle');
  256 |     await page.waitForSelector('tbody tr');
  257 |     const rowCount = await page.locator('tbody tr').count();
  258 |     expect(rowCount).toBeGreaterThan(0);
  259 |   });
  260 | 
  261 |   test('Offers page shows data', async ({ page }) => {
  262 |     await page.goto('/offers');
  263 |     await page.waitForLoadState('networkidle');
  264 |     await page.waitForSelector('tbody tr');
  265 |     const rowCount = await page.locator('tbody tr').count();
  266 |     expect(rowCount).toBeGreaterThan(0);
  267 |   });
  268 | 
  269 |   test('Market page shows data', async ({ page }) => {
  270 |     await page.goto('/market');
  271 |     await page.waitForLoadState('networkidle');
  272 |     
  273 |     const rowCount = await page.locator('tbody tr').count();
  274 |     // Market evidence may be empty if not synced
  275 |     if (rowCount > 0) {
  276 |       expect(rowCount).toBeGreaterThan(0);
  277 |     } else {
  278 |       // Verify page structure loads
  279 |       await expect(page.locator('main h1:has-text("Market Intelligence")')).toBeVisible();
```