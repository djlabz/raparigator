import { test, expect } from '@playwright/test';

test.describe('Feed', () => {
  test('visitante acessa o feed e vê seções de anúncios', async ({ page }) => {
    await page.goto('/feed');

    await expect(page.getByText('Modelos Premium').first()).toBeVisible();
    await expect(page.getByText('Outras modelos').first()).toBeVisible();
    await expect(page.getByText('Luna Velvet').first()).toBeVisible();
  });

  test('filtros rápidos ficam acessíveis', async ({ page }) => {
    await page.goto('/feed');

    await expect(page.getByRole('button', { name: 'Premium' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Livre Agora' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Com local/i }).first()).toBeVisible();
  });
});
