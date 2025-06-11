import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditableArrayField, type EditableArrayFieldProps } from '../EditableArrayField'

// Mock the Button component
vi.mock('~/components/ui/button', () => ({
  Button: ({ children, onClick, className, 'data-testid': testId, ...props }: any) => (
    <button onClick={onClick} className={className} data-testid={testId} {...props}>
      {children}
    </button>
  ),
}))

describe('EditableArrayField', () => {
  const defaultProps: EditableArrayFieldProps = {
    label: 'Test Items',
    value: ['Item 1', 'Item 2'],
    field: 'test-field',
    workExperienceId: 'work-exp-1',
    placeholder: 'Enter test item',
  }

  beforeEach(() => {
    // Clear any existing forms from previous tests
    document.body.innerHTML = ''
    // Clear console.log spy
    vi.clearAllMocks()
  })

  describe('Display Mode', () => {
    it('renders the label correctly', () => {
      render(<EditableArrayField {...defaultProps} />)
      expect(screen.getByText('Test Items')).toBeInTheDocument()
    })

    it('displays all items when value has items', () => {
      render(<EditableArrayField {...defaultProps} />)

      expect(screen.getByTestId('display-item-0')).toHaveTextContent('Item 1')
      expect(screen.getByTestId('display-item-1')).toHaveTextContent('Item 2')
    })

    it('shows correct item count', () => {
      render(<EditableArrayField {...defaultProps} />)
      expect(screen.getByTestId('item-count')).toHaveTextContent('2 items')
    })

    it('shows singular "item" for count of 1', () => {
      render(<EditableArrayField {...defaultProps} value={['Single Item']} />)
      expect(screen.getByTestId('item-count')).toHaveTextContent('1 item')
    })

    it('shows empty state when no items', () => {
      render(<EditableArrayField {...defaultProps} value={[]} />)

      expect(screen.getByTestId('empty-state')).toHaveTextContent('No test items added yet')
      expect(screen.getByTestId('item-count')).toHaveTextContent('0 items')
    })

    it('has edit button with proper aria-label', () => {
      render(<EditableArrayField {...defaultProps} />)

      const editButton = screen.getByTestId('edit-button')
      expect(editButton).toHaveAttribute('aria-label', 'Edit Test Items')
    })

    it('applies custom className', () => {
      render(<EditableArrayField {...defaultProps} className="custom-class" />)

      const container = screen.getByTestId('editable-array-field-test-field')
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Edit Mode', () => {
    it('switches to edit mode when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))

      expect(screen.getByTestId('array-input-0')).toBeInTheDocument()
      expect(screen.getByTestId('array-input-1')).toBeInTheDocument()
      expect(screen.getByTestId('save-button')).toBeInTheDocument()
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    })

    it('shows input fields with correct values', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))

      expect(screen.getByTestId('array-input-0')).toHaveValue('Item 1')
      expect(screen.getByTestId('array-input-1')).toHaveValue('Item 2')
    })

    it('shows placeholder text in input fields', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))

      expect(screen.getByTestId('array-input-0')).toHaveAttribute('placeholder', 'Enter test item')
    })

    it('shows add button with correct text', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))

      expect(screen.getByTestId('add-item-button')).toHaveTextContent('Add Test Item')
    })

    it('shows remove buttons for each item', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))

      expect(screen.getByTestId('remove-item-0')).toBeInTheDocument()
      expect(screen.getByTestId('remove-item-1')).toBeInTheDocument()
    })
  })

  describe('Editing Functionality', () => {
    it('updates input value when typed', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))
      const input = screen.getByTestId('array-input-0')

      await user.clear(input)
      await user.type(input, 'Updated Item')

      expect(input).toHaveValue('Updated Item')
    })

    it('adds new item when add button is clicked', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))
      await user.click(screen.getByTestId('add-item-button'))

      expect(screen.getByTestId('array-input-2')).toBeInTheDocument()
      expect(screen.getByTestId('array-input-2')).toHaveValue('')
    })

    it('removes item when remove button is clicked', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))
      await user.click(screen.getByTestId('remove-item-0'))

      // After removing first item, second item becomes the first
      expect(screen.getByTestId('array-input-0')).toHaveValue('Item 2')
      // Should only have one input field now
      expect(screen.queryByTestId('array-input-1')).not.toBeInTheDocument()
    })

    it('adds new item when Enter is pressed on last input with content', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))
      const lastInput = screen.getByTestId('array-input-1')

      await user.type(lastInput, 'Some content')
      await user.keyboard('{Enter}')

      expect(screen.getByTestId('array-input-2')).toBeInTheDocument()
    })

    it('does not add new item when Enter is pressed on empty last input', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))
      const lastInput = screen.getByTestId('array-input-1')

      await user.clear(lastInput)
      await user.keyboard('{Enter}')

      expect(screen.queryByTestId('array-input-2')).not.toBeInTheDocument()
    })

    it('does not add new item when Shift+Enter is pressed', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))
      const lastInput = screen.getByTestId('array-input-1')

      await user.keyboard('{Shift>}{Enter}{/Shift}')

      expect(screen.queryByTestId('array-input-2')).not.toBeInTheDocument()
    })
  })

  describe('Save Functionality', () => {
    it('calls onSave callback when provided', async () => {
      const mockOnSave = vi.fn()
      const user = userEvent.setup()

      render(<EditableArrayField {...defaultProps} onSave={mockOnSave} />)

      await user.click(screen.getByTestId('edit-button'))
      const input = screen.getByTestId('array-input-0')
      await user.clear(input)
      await user.type(input, 'Updated Item')
      await user.click(screen.getByTestId('save-button'))

      expect(mockOnSave).toHaveBeenCalledWith('test-field', ['Updated Item', 'Item 2'])
    })

    it('filters out empty items when saving', async () => {
      const mockOnSave = vi.fn()
      const user = userEvent.setup()

      render(<EditableArrayField {...defaultProps} onSave={mockOnSave} />)

      await user.click(screen.getByTestId('edit-button'))
      await user.click(screen.getByTestId('add-item-button'))
      // Leave the new item empty
      await user.click(screen.getByTestId('save-button'))

      expect(mockOnSave).toHaveBeenCalledWith('test-field', ['Item 1', 'Item 2'])
    })

    it('trims whitespace from items when saving', async () => {
      const mockOnSave = vi.fn()
      const user = userEvent.setup()

      render(<EditableArrayField {...defaultProps} onSave={mockOnSave} />)

      await user.click(screen.getByTestId('edit-button'))
      const input = screen.getByTestId('array-input-0')
      await user.clear(input)
      await user.type(input, '  Spaced Item  ')
      await user.click(screen.getByTestId('save-button'))

      expect(mockOnSave).toHaveBeenCalledWith('test-field', ['Spaced Item', 'Item 2'])
    })

    it('creates and submits form when no onSave callback provided', async () => {
      const user = userEvent.setup()

      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))

      // Should not crash when saving without callback
      await expect(user.click(screen.getByTestId('save-button'))).resolves.not.toThrow()

      // Should exit edit mode
      expect(screen.queryByTestId('array-input-0')).not.toBeInTheDocument()
      expect(screen.getByTestId('display-item-0')).toBeInTheDocument()
    })

    it('exits edit mode after saving', async () => {
      const mockOnSave = vi.fn()
      const user = userEvent.setup()

      render(<EditableArrayField {...defaultProps} onSave={mockOnSave} />)

      await user.click(screen.getByTestId('edit-button'))
      await user.click(screen.getByTestId('save-button'))

      // Should be back in display mode
      expect(screen.queryByTestId('array-input-0')).not.toBeInTheDocument()
      expect(screen.getByTestId('display-item-0')).toBeInTheDocument()
    })
  })

  describe('Cancel Functionality', () => {
    it('reverts changes when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))
      const input = screen.getByTestId('array-input-0')
      await user.clear(input)
      await user.type(input, 'Changed Item')
      await user.click(screen.getByTestId('cancel-button'))

      // Should be back in display mode with original values
      expect(screen.getByTestId('display-item-0')).toHaveTextContent('Item 1')
    })

    it('exits edit mode when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))
      await user.click(screen.getByTestId('cancel-button'))

      expect(screen.queryByTestId('array-input-0')).not.toBeInTheDocument()
      expect(screen.getByTestId('display-item-0')).toBeInTheDocument()
    })

    it('removes added items when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))
      await user.click(screen.getByTestId('add-item-button'))
      await user.click(screen.getByTestId('cancel-button'))

      // Should be back to original 2 items
      expect(screen.getByTestId('item-count')).toHaveTextContent('2 items')
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-labels for remove buttons', async () => {
      const user = userEvent.setup()
      render(<EditableArrayField {...defaultProps} />)

      await user.click(screen.getByTestId('edit-button'))

      expect(screen.getByTestId('remove-item-0')).toHaveAttribute('aria-label', 'Remove item 1')
      expect(screen.getByTestId('remove-item-1')).toHaveAttribute('aria-label', 'Remove item 2')
    })

    it('has proper test ids for all interactive elements', () => {
      render(<EditableArrayField {...defaultProps} />)

      expect(screen.getByTestId('editable-array-field-test-field')).toBeInTheDocument()
      expect(screen.getByTestId('edit-button')).toBeInTheDocument()
      expect(screen.getByTestId('item-count')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty initial value', () => {
      render(<EditableArrayField {...defaultProps} value={[]} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByTestId('item-count')).toHaveTextContent('0 items')
    })

    it('handles very long item text', () => {
      const longText =
        'This is a very long text that should still be handled properly by the component'
      render(<EditableArrayField {...defaultProps} value={[longText]} />)

      expect(screen.getByTestId('display-item-0')).toHaveTextContent(longText)
    })

    it('handles special characters in items', () => {
      const specialText = 'Item with "quotes" & <tags> and émojis 🎉'
      render(<EditableArrayField {...defaultProps} value={[specialText]} />)

      expect(screen.getByTestId('display-item-0')).toHaveTextContent(specialText)
    })

    it('handles removing all items', async () => {
      const mockOnSave = vi.fn()
      const user = userEvent.setup()

      render(<EditableArrayField {...defaultProps} onSave={mockOnSave} />)

      await user.click(screen.getByTestId('edit-button'))
      await user.click(screen.getByTestId('remove-item-0'))
      await user.click(screen.getByTestId('remove-item-0')) // Remove what was item 1
      await user.click(screen.getByTestId('save-button'))

      expect(mockOnSave).toHaveBeenCalledWith('test-field', [])
    })

    it('updates when value prop changes', async () => {
      const { rerender } = render(<EditableArrayField {...defaultProps} />)

      expect(screen.getByTestId('display-item-0')).toHaveTextContent('Item 1')

      // Change the value prop
      rerender(<EditableArrayField {...defaultProps} value={['New Item']} />)

      expect(screen.getByTestId('display-item-0')).toHaveTextContent('New Item')
      expect(screen.queryByTestId('display-item-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('item-count')).toHaveTextContent('1 item')
    })
  })
})
