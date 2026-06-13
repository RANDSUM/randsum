import { expect, test } from '@playwright/test'

// Smoke test: boot the real Expo web build and perform one roll (X1b).
//
// The index screen seeds its notation from the `?n=` query param on web (see
// app/index.tsx mount effect), so we load with `?n=4d6L`, click the real roll button
// exposed by @randsum/dice-ui's NotationRoller (aria-label "Roll the dice"), and assert
// the real result dialog (aria-label "Roll result") appears with a numeric total.

test('rolls 4d6L and shows a result dialog with a total', async ({ page }) => {
  await page.goto('/?n=4d6L')

  // The notation input is hydrated from ?n=. Confirm the app mounted and the input carries
  // the seeded notation before rolling.
  const input = page.getByLabel('Dice notation')
  await expect(input).toBeVisible({ timeout: 15_000 })
  await expect(input).toHaveValue('4d6L')

  // Perform the roll.
  await page.getByRole('button', { name: 'Roll the dice' }).click()

  // The result modal opens with a total. 4d6 drop-lowest is always within [3, 18].
  const dialog = page.getByRole('dialog', { name: 'Roll result' })
  await expect(dialog).toBeVisible({ timeout: 10_000 })

  const totalText = (await dialog.innerText()).trim()
  const match = totalText.match(/\d+/)
  expect(match, `expected a numeric total in the dialog, got: ${totalText}`).not.toBeNull()
  const total = Number(match?.[0])
  expect(total).toBeGreaterThanOrEqual(3)
  expect(total).toBeLessThanOrEqual(18)
})
