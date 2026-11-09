import { describe, it, expect } from 'vitest'
import { FALLBACK_CLAUSES } from '../policyClauseConstants'

// Fallback list used when the policy API has not loaded; admins pick a clause from it when ruling on a report.
describe('FALLBACK_CLAUSES', () => {
  it('is a non-empty list', () => {
    expect(FALLBACK_CLAUSES.length).toBeGreaterThan(0)
  })

  it('gives every clause the fields the selector renders', () => {
    for (const clause of FALLBACK_CLAUSES) {
      for (const field of ['code', 'policyKey', 'title', 'summary', 'description', 'category']) {
        expect(clause[field], `${clause.code}.${field}`).toEqual(expect.any(String))
        expect(clause[field].trim(), `${clause.code}.${field}`).not.toBe('')
      }
    }
  })

  it('keeps code and policyKey in sync, as in the platform_policies table', () => {
    for (const clause of FALLBACK_CLAUSES) expect(clause.policyKey).toBe(clause.code)
  })

  it('has unique codes', () => {
    const codes = FALLBACK_CLAUSES.map((c) => c.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('uses upper-snake codes', () => {
    for (const { code } of FALLBACK_CLAUSES) expect(code).toMatch(/^[A-Z][A-Z0-9_]+$/)
  })

  it('uses upper-snake categories', () => {
    for (const { category } of FALLBACK_CLAUSES) expect(category).toMatch(/^[A-Z][A-Z_]+$/)
  })
})
