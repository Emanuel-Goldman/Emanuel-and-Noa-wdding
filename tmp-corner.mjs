import { chromium } from 'playwright'

const SHOTS = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 4 })
await page.goto('https://emanuel-and-noa.web.app', { waitUntil: 'domcontentloaded' })
await page.locator('.gallery-item').first().waitFor({ timeout: 20000 })

// Zoomed crop of the top-right corner, as it looks today.
await page.screenshot({ path: `${SHOTS}/corner-current.png`, clip: { x: 320, y: 0, width: 70, height: 70 } })

const contrast = await page.evaluate(() => {
  const el = document.querySelector('.admin-toggle')
  const s = getComputedStyle(el)
  return { color: s.color, opacity: s.opacity, fontSize: s.fontSize, bg: getComputedStyle(document.body).backgroundColor }
})
console.log('current:', JSON.stringify(contrast))

// Same corner with a more findable treatment, for comparison only.
await page.evaluate(() => {
  const el = document.querySelector('.admin-toggle')
  el.style.opacity = '0.5'
  el.textContent = '♥'
  el.style.fontSize = '1.1rem'
  el.style.color = '#b8734f'
})
await page.screenshot({ path: `${SHOTS}/corner-alt.png`, clip: { x: 320, y: 0, width: 70, height: 70 } })

await browser.close()
console.log('done')
