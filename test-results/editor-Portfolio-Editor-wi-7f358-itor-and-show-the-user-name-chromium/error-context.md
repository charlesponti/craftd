# Test info

- Name: Portfolio Editor (with test auth cookie) >> should load the editor and show the user name
- Location: /Users/charlesponti/Developer/craftd_react/tests/editor.spec.ts:20:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('text=Portfolio Editor')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('text=Portfolio Editor')

    at /Users/charlesponti/Developer/craftd_react/tests/editor.spec.ts:22:57
```

# Page snapshot

```yaml
- text: "[vite] The requested module 'drizzle-orm' does not provide an export named 'inferInsert' at analyzeImportedModDifference (file:///Users/charlesponti/Developer/craftd_react/node_modules/vite/dist/node/module-runner.js:530:39) at ModuleRunner.processImport (file:///Users/charlesponti/Developer/craftd_react/node_modules/vite/dist/node/module-runner.js:1142:56) at ModuleRunner.cachedRequest (file:///Users/charlesponti/Developer/craftd_react/node_modules/vite/dist/node/module-runner.js:1178:21 Click outside, press Esc key, or fix the code to dismiss. You can also disable this overlay by setting"
- code: server.hmr.overlay
- text: to
- code: "false"
- text: in
- code: vite.config.ts
- text: .
```

# Test source

```ts
   1 | import { test, expect } from "@playwright/test";
   2 |
   3 | test.describe("Portfolio Editor (with test auth cookie)", () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     await page.goto("/");
   6 |     const testUser = {
   7 |       id: "00000000-0000-0000-0000-000000000000",
   8 |       email: "test@example.com",
   9 |       name: "Test User",
  10 |     };
  11 |     await page.context().addCookies([
  12 |       {
  13 |         name: "test-auth-user",
  14 |         value: encodeURIComponent(JSON.stringify(testUser)),
  15 |         url: "http://localhost:3000",
  16 |       },
  17 |     ]);
  18 |   });
  19 |
  20 |   test("should load the editor and show the user name", async ({ page }) => {
  21 |     await page.goto("/portfolio-editor");
> 22 |     await expect(page.locator("text=Portfolio Editor")).toBeVisible();
     |                                                         ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  23 |     // Add more assertions as needed
  24 |   });
  25 | });
  26 |
```