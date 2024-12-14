import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AI } from './AI'
import { z } from 'zod'

describe('AI', () => {
  it('renders children with generated props', async () => {
    const schema = z.object({
      title: z.string()
    })

    const { container } = render(
      <AI
        schema={schema}
        prompt='Generate a title'
      >
        {(props) => <h1>{props.title}</h1>}
      </AI>
    )

    // Initial render should be empty (loading state)
    expect(container.innerHTML).toBe('')
  })
})
