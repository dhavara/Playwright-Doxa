---
name: playwright-aggrid
description: Best practices for writing reliable Playwright tests that interact with AG Grid React tables, including scrolling, clicking, editing cells, handling dropdowns, and avoiding common pitfalls.
---


# SKILL: Writing E2E Tests for AG Grid React Tables with Playwright

## Overview
AG Grid renders cells outside the normal DOM flow and manages its own virtual scroll. Standard Playwright selectors like `getByRole('option')` or `getByText().click()` often fail or trigger unintended navigation. This skill covers reliable patterns for interacting with AG Grid in Playwright tests.

---

## 1. Scrolling the Grid Horizontally

AG Grid virtualizes columns — cells outside the viewport don't exist in the DOM. Always scroll horizontally before interacting with any column that may be off-screen.

```ts
// Scroll the ag-grid body all the way to the right
const gridBody = this.page.locator(
  '#panel1a-content > div > div:nth-child(2) > div > div > div > div > div.ag-root-wrapper-body.ag-layout-normal.ag-focus-managed > div.ag-root.ag-unselectable.ag-layout-normal > div.ag-body-viewport.ag-layout-normal.ag-row-animation > div.ag-center-cols-clipper > div'
);
await gridBody.evaluate(el => el.scrollLeft = el.scrollWidth);
await this.page.waitForTimeout(400);
```

To scroll back to the left:
```ts
await gridBody.evaluate(el => el.scrollLeft = 0);
```

---

## 2. Clicking and Editing a Cell

AG Grid cells require a real DOM click event with `bubbles: true` to trigger the cell editor. Use `evaluate` for reliable click dispatch:

```ts
const cell = this.page.locator(
  '#panel1a-content .ag-center-cols-clipper .ag-row:nth-child(1) [col-id="claimAmt"]'
);
await cell.scrollIntoViewIfNeeded();
await cell.evaluate(el => {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
});
await this.page.waitForTimeout(400);
await this.page.waitForSelector('[role="textbox"][aria-label="Input Editor"]', { timeout: 5000 });
await this.page.getByRole('textbox', { name: 'Input Editor' }).fill('100');
await this.page.getByRole('textbox', { name: 'Input Editor' }).press('Enter');
```

Or if the cell is visible and accessible via gridcell role:
```ts
const fillCell = async (nth: number) => {
  const cell = this.page.getByRole('gridcell', { name: '100.00' }).nth(nth);
  await cell.scrollIntoViewIfNeeded();
  await cell.click();
  await this.page.waitForTimeout(600);
  await this.page.getByRole('textbox', { name: 'Input Editor' }).fill(data.claim_amount);
  await this.page.getByRole('textbox', { name: 'Input Editor' }).press('Enter');
  await this.page.waitForTimeout(600);
};

await fillCell(1);
await fillCell(3);
await fillCell(5);
```

---

## 3. Targeting Editable (Blue) Rows Only

AG Grid marks group/summary rows with `.ag-row-group`. To target only editable leaf rows:

```ts
const editableCells = this.page.locator(
  '#panel1a-content .ag-center-cols-clipper .ag-row:not(.ag-row-group) [col-id="claimAmt"]'
);
const count = await editableCells.count();

for (let i = 0; i < count; i++) {
  const cell = editableCells.nth(i);
  await cell.scrollIntoViewIfNeeded();
  await cell.evaluate(el => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await this.page.waitForTimeout(400);
  await this.page.getByRole('textbox', { name: 'Input Editor' }).fill(data.claim_amount);
  await this.page.getByRole('textbox', { name: 'Input Editor' }).press('Tab');
  await this.page.waitForTimeout(300);
}
```

---

## 4. Double-Clicking a Row to Open Detail

AG Grid row double-click often opens a detail page or new tab:

```ts
// Double-click first matching row (use .first() to avoid strict mode violations)
await this.page.getByRole('gridcell', { name: data.project_title }).first().dblclick();

// If it opens a new tab, capture and switch to it
const newPage = await this.page.context().waitForEvent('page');
await newPage.waitForLoadState('networkidle');
```

---

## 5. React-Select Dropdowns Inside AG Grid

React-select renders its options in a portal outside the normal DOM — `getByRole('option')` is unreliable. Always use one of these patterns:

**Pattern A — getByText (preferred for exact labels):**
```ts
await this.page.locator('svg').first().click(); // open dropdown
await this.page.locator('#react-select-2-input').fill('sgd');
await this.page.waitForTimeout(400);
await this.page.getByText('Singapore Dollar (SGD)', { exact: true }).click();
```

**Pattern B — keyboard navigation (use when getByText triggers navigation):**
```ts
await this.page.locator('#react-select-2-input').fill('sgd');
await this.page.waitForTimeout(400);
await this.page.locator('#react-select-2-input').focus();
await this.page.locator('#react-select-2-input').press('ArrowDown');
await this.page.locator('#react-select-2-input').press('Enter');
```

**Pattern C — ID-based option targeting (most specific):**
```ts
await this.page.locator('#react-select-2-option-0').click(); // first option
await this.page.locator('[id^="react-select-2-option"]').filter({ hasText: 'SGD' }).click();
```

---

## 6. Multi-Select Dropdowns (Team Members etc.)

After each selection, the list re-indexes from 0. Always reopen and click `option-0` in a loop:

```ts
// Open dropdown first, THEN count
await this.page.getByText('Please select Project Team').click();
await this.page.waitForTimeout(400);
const count = await this.page.locator('[id^="react-select-6-option"]').count();

for (let i = 0; i < count; i++) {
  await this.page.keyboard.press('ArrowDown');
  await this.page.keyboard.press('Enter');
  await this.page.waitForTimeout(300);
}
```

---

## 7. Common Pitfalls

| Problem | Cause | Fix |
|---|---|---|
| Cell click does nothing | Cell not in viewport | `scrollIntoViewIfNeeded()` or scroll grid body |
| `getByRole('option')` times out | React-select portal rendering | Use `getByText` or keyboard navigation |
| `getByText().click()` closes page | Text is inside an anchor tag | Use `press('ArrowDown') + press('Enter')` |
| `strict mode violation` on gridcell | Multiple rows match | Add `.first()` or `.nth(n)` |
| Input Editor never appears | Cell editor not triggered | Use `evaluate` with `MouseEvent` dispatch |
| Count is 0 before opening dropdown | Options only exist in DOM when open | Always open dropdown before calling `.count()` |
| Loop stops after first team member | Placeholder text disappears | Use `#react-select-input` click or keyboard to reopen |
