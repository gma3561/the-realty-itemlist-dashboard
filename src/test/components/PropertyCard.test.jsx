import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PropertyCard from '../../components/property/PropertyCard'

const mockProperty = {
  id: 1,
  property_name: 'Test Property',
  location: 'Test Address',
  sale_price: 100000000,
  property_type: 'apt',
  transaction_type: 'sale',
  property_status: 'available',
  created_at: '2024-01-01T00:00:00.000Z',
  user: {
    name: 'Test User'
  }
}

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('PropertyCard', () => {
  it('should render property information correctly', () => {
    renderWithRouter(<PropertyCard property={mockProperty} />)

    expect(screen.getByText('Test Property')).toBeInTheDocument()
    expect(screen.getByText('Test Address')).toBeInTheDocument()
    expect(screen.getByText(/1억원/)).toBeInTheDocument()
  })

  it('should handle missing property data gracefully', () => {
    const incompleteProperty = {
      id: 2,
      property_name: 'Incomplete Property',
      created_at: '2024-01-01T00:00:00.000Z'
    }

    renderWithRouter(<PropertyCard property={incompleteProperty} />)

    expect(screen.getByText('Incomplete Property')).toBeInTheDocument()
  })
})