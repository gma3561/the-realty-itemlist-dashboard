import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase before importing services
vi.mock('../services/supabase', () => ({
  default: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      then: vi.fn()
    }))
  }
}))

import * as propertyService from '../services/propertyService'

describe('Property Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProperties', () => {
    it('should be callable', () => {
      expect(typeof propertyService.getProperties).toBe('function')
    })
  })

  describe('createProperty', () => {
    it('should be callable', () => {
      expect(typeof propertyService.createProperty).toBe('function')
    })
  })
})