import { describe, expect, it } from 'vitest'
import { looksLikeResume } from './resume-heuristic'

const RESUME = `JAMIE MORALES
jamie.morales@email.com | (555) 234-5678 | Austin, TX

SUMMARY
Software engineer with 4 years building web applications.

EXPERIENCE
Software Engineer, Cloudbase Inc — 2021 to Present
- Built and maintained the billing service.

EDUCATION
B.S. Computer Science, University of Texas — 2020

SKILLS
JavaScript, React, Node.js, Git, REST APIs`

const COVER_LETTER = `Dear Hiring Manager,

I am writing to apply for the Software Engineer position at your company. I am
excited to apply because I have long admired your work. In my current role I
have gained experience building web applications and would bring that to your
team. Please find attached my resume for your review.

Sincerely,
Jamie Morales
jamie.morales@email.com`

const ESSAY = `The Impact of Remote Work on Modern Teams

Over the past decade, remote work has reshaped how organizations operate. This
essay examines the cultural and logistical shifts that accompany distributed
teams, drawing on recent studies and first-hand accounts from practitioners
across several industries.`

const INVOICE = `INVOICE #4471
Bill To: Acme Corp
Date: 2024-03-01
Description: Consulting services, March 2024
Amount Due: $4,500.00
Payment terms: Net 30`

describe('looksLikeResume', () => {
  it('accepts a normal resume', () => {
    expect(looksLikeResume(RESUME).isResume).toBe(true)
  })

  it('flags a cover letter as not a resume', () => {
    const verdict = looksLikeResume(COVER_LETTER)
    expect(verdict.isResume).toBe(false)
    if (!verdict.isResume) expect(verdict.reason).toMatch(/cover letter/i)
  })

  it('flags an essay as not a resume', () => {
    expect(looksLikeResume(ESSAY).isResume).toBe(false)
  })

  it('flags an invoice as not a resume', () => {
    expect(looksLikeResume(INVOICE).isResume).toBe(false)
  })

  it('accepts a resume even without an explicit SKILLS section', () => {
    const sparse = `Alex Rivera
alex@example.com

Work Experience
Product Manager, Beta Inc — 2019 to 2022

Education
B.A. Economics — 2019`
    expect(looksLikeResume(sparse).isResume).toBe(true)
  })

  it('gives a reason mentioning resume markers when signals are absent', () => {
    const verdict = looksLikeResume('just some random text with no structure at all')
    expect(verdict.isResume).toBe(false)
    if (!verdict.isResume) expect(verdict.reason).toMatch(/Experience|markers/i)
  })
})
