import { test, expect, devices } from '@playwright/test';
import { seedUserRole } from './helpers/auth';

test.use(devices['Pixel 7']);

test.describe('Navegação por abas (mobile)', () => {
  test('cliente alterna Feed, Chat e Acompanhamento', async ({ page }) => {
    await seedUserRole(page, 'cliente');
    await page.goto('/feed');

    const nav = page.getByRole('navigation', { name: 'Navegação principal' });
    await expect(nav).toBeVisible();

    await nav.getByRole('link', { name: 'Chat' }).click();
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByRole('heading', { name: 'Conversas' })).toBeVisible();

    await nav.getByRole('link', { name: 'Acompanhamento' }).click();
    await expect(page).toHaveURL(/\/acompanhamento/);

    await nav.getByRole('link', { name: 'Feed' }).click();
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.getByText('Luna Velvet').first()).toBeVisible();
  });

  test('profissional tem aba Painel', async ({ page }) => {
    await seedUserRole(page, 'profissional');
    await page.goto('/feed');

    const nav = page.getByRole('navigation', { name: 'Navegação principal' });
    await expect(nav.getByRole('link', { name: 'Painel' })).toBeVisible();
    await nav.getByRole('link', { name: 'Painel' }).click();
    await expect(page).toHaveURL(/\/profissional\/dashboard/);
  });
});
