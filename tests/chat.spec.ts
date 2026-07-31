import { test, expect } from '@playwright/test';
import { seedUserRole } from './helpers/auth';

test.describe('Chat', () => {
  test('visitante vê bloqueio e CTAs de auth', async ({ page }) => {
    await page.goto('/chat');

    await expect(page.getByRole('heading', { name: 'Chat privado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar conta' }).first()).toBeVisible();
  });

  test('cliente logado acessa lista de conversas', async ({ page }) => {
    await seedUserRole(page, 'cliente');
    await page.goto('/chat');

    await expect(page.getByRole('heading', { name: 'Conversas' })).toBeVisible();
  });
});
