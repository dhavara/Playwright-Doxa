import { Page } from '@playwright/test';

export interface ProjectData {
  dtf_project_code: string;
  project_code: string;
  project_title: string;
  start_date: string;
  end_date: string;
  currency: string;
  currency_label: string;
  overall_budget: string;
  project_address: string;
  project_description: string;
  overall_pic: string;
  project_admin: string;
  team_members_count: number;
}

export class ProjectPage {
  constructor(private page: Page) {}

  async navigateToProjectList() {
    await this.page.getByText('System Configuration').click();
    await this.page.locator('a').filter({ hasText: 'Project Management' }).click();
    await this.page.getByRole('link', { name: 'List of Project' }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreateNew() {
    await this.page.getByRole('button', { name: ' Create New' }).click();
    await this.page.waitForLoadState('networkidle');
    // Confirm the DTF Project modal
    await this.page.getByText('Yes').click();
    await this.page.waitForLoadState('networkidle');
  }

  async ProjectInfo(data: ProjectData) {
    // DTF Project Code
    await this.page.getByRole('textbox', { name: 'Enter DTF Project Code' }).fill(data.dtf_project_code);

    // Project Code
    await this.page.getByRole('textbox', { name: 'Project Code', exact: true }).fill(data.project_code);

    // Project Title
    await this.page.getByRole('textbox', { name: 'Enter Project Title' }).fill(data.project_title);

    // Start Date & End Date (placeholders used by the actual site)
    await this.page.getByPlaceholder('EnterStartDate').fill(data.start_date);
    await this.page.getByPlaceholder('EnterEndDate').fill(data.end_date);

    // Currency — react-select searchable dropdown
    await this.page.locator('svg').first().click();
    await this.page.locator('#react-select-2-input').fill(data.currency);
    // Click the matching option text, e.g. "Singapore Dollar (SGD)"
    await this.page.getByText(data.currency_label, { exact: true }).click();

    // Overall Budget
    await this.page.getByRole('textbox', { name: 'Enter Project Budget' }).fill(data.overall_budget);

    // Project Address — react-select dropdown, click second SVG trigger
    await this.page.locator('svg').nth(1).click();
    await this.page.getByText(data.project_address, { exact: true }).click();

    // Project Description
    await this.page.getByRole('textbox', { name: 'Enter Project Description' }).fill(data.project_description);
  }

  async ProjectMembers(data: ProjectData) {
    // Overall Project In-Charge
    await this.page.getByRole('row', { name: 'Overall Project In-Charge *' }).locator('svg').click();
    await this.page.waitForTimeout(400);
    await this.page.locator('#react-select-4-input').fill(data.overall_pic);
    await this.page.waitForTimeout(600);
    await this.page.locator('[id^="react-select-4-option"]').filter({ hasText: data.overall_pic }).click();

    // Project Admin
    await this.page.getByRole('row', { name: 'Project Admin *' }).locator('svg').click();
    await this.page.waitForTimeout(400);
    await this.page.locator('#react-select-5-input').fill(data.project_admin);
    await this.page.waitForTimeout(600);
    await this.page.locator('[id^="react-select-5-option"]').filter({ hasText: data.project_admin }).click();

    // Project Team Members
    // Open dropdown first, THEN count available options
    await this.page.getByText('Please select Project Team').click();
    await this.page.waitForTimeout(400);

    const count = await this.page.locator('[id^="react-select-6-option"]').count();
    console.log(`Found ${count} team members available`);

    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press('ArrowDown'); // highlight the first option
      await this.page.keyboard.press('Enter');     // select it
      await this.page.waitForTimeout(300);
    }

    // Close team member dropdown
    await this.page.locator('div:nth-child(3) > .css-tj5bde-Svg').click();
  }

  async submitAndConfirm() {
    await this.page.getByRole('button', { name: 'Create' }).click();
    await this.page.getByRole('button', { name: 'Yes' }).click();
    await this.page.getByRole('button', { name: 'I Understand' }).click();
    await this.page.waitForLoadState('networkidle');
  }
}
