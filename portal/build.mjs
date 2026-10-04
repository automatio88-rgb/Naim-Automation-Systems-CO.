// Static build for the Digital Document Portal → dist/ (deployed by Netlify).
// SITE_URL (optional) makes the brand logo link back to the landing page domain.
import { mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs'
import { docsHubPage } from './src/docs/hub.tsx'
import { onboardingPage } from './src/docs/onboarding.tsx'
import { quotationPage } from './src/docs/quotation.tsx'

const SITE_URL = process.env.SITE_URL || '/'
const brand = (html) => html.replaceAll('class="brand" href="/"', `class="brand" href="${SITE_URL}"`)

const pages = {
  'docs/index.html': docsHubPage(),
  'docs/onboarding/index.html': onboardingPage(),
  'docs/quotation/index.html': quotationPage(),
}

rmSync('dist', { recursive: true, force: true })
mkdirSync('dist', { recursive: true })
cpSync('public', 'dist', { recursive: true })
for (const [file, html] of Object.entries(pages)) {
  mkdirSync(`dist/${file.split('/').slice(0, -1).join('/')}`, { recursive: true })
  writeFileSync(`dist/${file}`, brand(html))
}
console.log('portal: built', Object.keys(pages).join(', '))