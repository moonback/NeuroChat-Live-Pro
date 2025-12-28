import { test, expect } from '@playwright/test';

test.describe('NeuroChat Live Pro - Smoke', () => {
  test('la page se charge et affiche le branding + statut', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/NeuroChat Pro/i);

    // Branding (header)
    await expect(page.getByRole('heading', { name: 'NEUROCHAT PRO', exact: true })).toBeVisible();

    // Statut de connexion (pill)
    await expect(page.getByRole('status')).toBeVisible();
    // Note: on ne vérifie pas le texte exact ici (trop dépendant du rendu/état).
    // Le smoke test garantit surtout que l'UI critique est montée.
  });
});


