import { Page } from '@playwright/test';

export interface ProjectData {
  dtf_project_code: string;
  project_code: string;
  project_title: string;
  start_date: string;
  end_date: string;
  currency: string;
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
    await this.page.getByRole('link', { name: 'System Configuration' }).click();
    await this.page.getByRole('link', { name: 'Project Management' }).click();
    await this.page.getByRole('link', { name: 'List of Project' }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreateNew() {
    await this.page.getByRole('button', { name: 'Create New' }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async fillProjectInfo(data: ProjectData) {
    // Enable DTF Project toggle
    const dtfToggle = this.page.locator('label').filter({ hasText: 'DTF Project?' }).locator('..').getByRole('switch');
    const isChecked = await dtfToggle.isChecked().catch(() => false);
    if (!isChecked) {
      await dtfToggle.click();
    }

    // DTF Project Code (shared across supply chain)
    await this.page.getByLabel('DTF Project Code').fill(data.dtf_project_code);

    // Project Code
    await this.page.getByLabel('Project Code').fill(data.project_code);

    // Project Title
    await this.page.getByLabel('Project Title').fill(data.project_title);

    // Start Date
    await this.page.getByLabel('Start Date').fill(data.start_date);

    // End Date
    await this.page.getByLabel('End Date').fill(data.end_date);

    // Currency — select SGD then press Escape to dismiss the dropdown overlay
    await this.page.getByLabel('Currency').click();
    await this.page.getByRole('option', { name: data.currency }).click();
    await this.page.keyboard.press('Escape');

    // Overall Budget (now accessible after dropdown is dismissed)
    await this.page.getByLabel('Overall Budget').fill(data.overall_budget);

    // Project Address — autocomplete field: fill, wait for dropdown, click first option
    const addressInput = this.page.getByLabel('Project Address');
    await addressInput.fill(data.project_address);
    await this.page.waitForSelector('[role="listbox"], [role="option"], .dropdown-menu', { timeout: 5000 });
    await this.page.locator('[role="option"]').first().click();

    // Project Description
    await this.page.getByLabel('Project Description').fill(data.project_description);
  }

  async fillProjectMembers(data: ProjectData) {
    // Overall Project In-Charge
    await this.page.getByLabel('Overall Project In-Charge').click();
    await this.page.getByRole('option', { name: data.overall_pic }).click();

    // Project Admin
    await this.page.getByLabel('Project Admin').click();
    await this.page.getByRole('option', { name: data.project_admin }).click();

    // Project Team Members — custom multi-select: click to open, then press Enter for each member
    const teamMembersDropdown = this.page.getByLabel('Project Team Members');
    await teamMembersDropdown.click();
    for (let i = 0; i < data.team_members_count; i++) {
      await this.page.keyboard.press('Enter');
    }
    // Close the dropdown
    await this.page.keyboard.press('Escape');
  }

  async submitAndConfirm() {
    await this.page.getByRole('button', { name: 'Create' }).click();
    // Confirm the modal dialog
    await this.page.getByRole('button', { name: 'Confirm' }).click();
    await this.page.waitForLoadState('networkidle');
  }
}
