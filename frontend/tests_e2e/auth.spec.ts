import { test, expect } from '@playwright/test';

test.describe('Authentication Portal E2E Tests', () => {

  test('should load student login page and verify elements', async ({ page }) => {
    await page.goto('/student/login');
    
    // Verify title and subtitle using specific text selectors
    await expect(page.locator('h2:has-text("Student Portal")')).toBeVisible();
    await expect(page.locator('p:has-text("Sign in to access your team dashboard")')).toBeVisible();
    
    // Verify inputs and submit button
    await expect(page.locator('label:has-text("Email Address")')).toBeVisible();
    await expect(page.locator('label:has-text("Password")').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toContainText('Sign In');
  });

  test('should slide and transition to registration form', async ({ page }) => {
    await page.goto('/student/login');
    
    // Click register link
    const registerLink = page.locator('span:has-text("Register Student Profile")');
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    
    // Verify URL updates and registration header is shown
    await expect(page).toHaveURL(/.*\/student\/register/);
    await expect(page.locator('h2:has-text("Register Profile")')).toBeVisible();
    
    // Verify registration inputs
    await expect(page.locator('label:has-text("Full Name *")')).toBeVisible();
    await expect(page.locator('label:has-text("Roll Number / Student ID *")')).toBeVisible();
    await expect(page.locator('label:has-text("Department *")')).toBeVisible();
    
    // Toggle back to login
    const loginLink = page.locator('span:has-text("Sign In")');
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    
    // Verify it returns to student login
    await expect(page).toHaveURL(/.*\/student\/login/);
    await expect(page.locator('h2:has-text("Student Portal")')).toBeVisible();
  });

  test('should navigate between role-specific portals', async ({ page }) => {
    await page.goto('/student/login');
    
    // 1. Navigate to Coordinator portal
    const coordLink = page.locator('a:has-text("Coordinator")');
    await expect(coordLink).toBeVisible();
    await coordLink.click();
    await expect(page).toHaveURL(/.*\/coordinator\/login/);
    await expect(page.locator('h2:has-text("Coordinator Login")')).toBeVisible();
    
    // 2. Navigate to Judge portal
    const judgeLink = page.locator('a:has-text("Judge")');
    await expect(judgeLink).toBeVisible();
    await judgeLink.click();
    await expect(page).toHaveURL(/.*\/judge\/login/);
    await expect(page.locator('h2:has-text("Judge Login")')).toBeVisible();
    
    // 3. Navigate to SPOC portal
    const spocLink = page.locator('a:has-text("SPOC")');
    await expect(spocLink).toBeVisible();
    await spocLink.click();
    await expect(page).toHaveURL(/.*\/spoc\/login/);
    await expect(page.locator('h2:has-text("College SPOC Login")')).toBeVisible();
  });
});
