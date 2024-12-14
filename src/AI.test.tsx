import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AI } from './AI'
import { z } from 'zod'

describe('AI', () => {
  it('renders children with generated props', async () => {
    type TestProps = {
      title: string
    }

    const schema = z
      .object({
        title: z.string(),
      })
      .required()

    const { container } = render(<AI<TestProps> schema={schema} prompt='Generate a title' children={(props: TestProps) => <h1>{props.title}</h1>} />)

    // Initial render should be empty (loading state)
    expect(container.innerHTML).toBe('')
  })
})
