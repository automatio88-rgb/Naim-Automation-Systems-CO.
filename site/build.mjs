// Static build for the landing page → dist/ (deployed by Netlify).
// The page is a plain template string, so the build is just render + copy assets.
import { mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs'
import { landingPage } from './src/landing.tsx'

rmSync('dist', { recursive: true, force: true })
mkdirSync('dist', { recursive: true })
cpSync('public', 'dist', { recursive: true })
writeFileSync('dist/index.html', landingPage())
console.log('site: built dist/index.html')