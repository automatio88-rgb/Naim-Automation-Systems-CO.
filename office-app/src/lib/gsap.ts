import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import { CustomEase } from 'gsap/CustomEase'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP, ScrollTrigger, Flip, CustomEase)
CustomEase.create('md-emph', '0.2,0,0,1')
CustomEase.create('md-emph-decel', '0.05,0.7,0.1,1')
CustomEase.create('md-emph-accel', '0.3,0,0.8,0.15')
gsap.defaults({ duration: 0.5, ease: 'md-emph' })

/** shared with CSS tokens (--ease-emph*, durations) */
export const motion = { emph: 0.5, emphDecel: 0.4, emphAccel: 0.2, std: 0.3, stdDecel: 0.25, stdAccel: 0.2 }

export const prefersReduced = () =>
  document.documentElement.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches

export { gsap, ScrollTrigger, Flip, useGSAP }