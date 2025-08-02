import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock Supabase before importing AuthContext
vi.mock('../../services/supabase', () => ({
  default: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signOut: vi.fn()
    }
  }
}))

import { AuthProvider, useAuth } from '../../context/AuthContext'

// Test component to access auth context
const TestComponent = () => {
  const { user, loading } = useAuth()
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render AuthProvider without crashing', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })
})