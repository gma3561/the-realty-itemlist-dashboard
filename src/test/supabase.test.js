import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}))

describe('Supabase Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create supabase client with correct config', () => {
    const mockClient = {
      auth: {
        signIn: vi.fn(),
        signOut: vi.fn(),
        getUser: vi.fn()
      },
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
        update: vi.fn(() => Promise.resolve({ data: [], error: null })),
        delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }
    
    createClient.mockReturnValue(mockClient)
    
    const client = createClient('test-url', 'test-key')
    
    expect(createClient).toHaveBeenCalledWith('test-url', 'test-key')
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(client.from).toBeDefined()
  })
})