import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AI } from './AI'
import { streamObject } from 'ai'
import { z } from 'zod'
import { createSchemaFromObject } from './utils/schema'
import type { SchemaObject, SchemaShape } from './utils/schema'
import { cn } from './utils/styles'
import type { StreamObjectResult } from './types/ai'

vi.mock('ai', () => {
  return {
    streamObject: vi.fn(),
    generateObject: vi.fn(),
  }
})

type MockFetch = ReturnType<typeof vi.fn>

describe('AI', () => {
  it('renders with simplified schema interface', async () => {
    const schema: SchemaObject = {
      productType: 'App | API | Marketplace | Platform | Packaged Service | Professional Service | Website',
      profile: {
        customer: 'ideal customer profile in 3-5 words',
        solution: 'describe the offer in 4-10 words',
      },
      description: 'website meta description',
      tags: ['SEO-optimized meta tags'],
    }

    const zodSchema = createSchemaFromObject(schema)
    const testData: SchemaShape = {
      productType: 'App',
      profile: {
        customer: 'Small Business Owners',
        solution: 'Automated Accounting Software',
      },
      description: 'Effortless accounting for small businesses',
      tags: ['accounting', 'small business', 'automation'],
    }

    // Verify schema conversion
    expect(() => zodSchema.parse(testData)).not.toThrow()

    // Verify enum conversion
    const productTypeSchema = zodSchema.shape.productType as z.ZodEnum<[string, ...string[]]>
    expect(productTypeSchema._def.values).toContain('App')
    expect(productTypeSchema._def.values).toContain('API')
    expect(productTypeSchema._def.values).toContain('Marketplace')
    expect(productTypeSchema._def.values).toContain('Platform')
    expect(productTypeSchema._def.values).toContain('Packaged Service')
    expect(productTypeSchema._def.values).toContain('Professional Service')
    expect(productTypeSchema._def.values).toContain('Website')

    // Verify profile object structure
    const profileSchema = zodSchema.shape.profile as z.ZodObject<any>
    expect(profileSchema.shape.customer).toBeDefined()
    expect(profileSchema.shape.solution).toBeDefined()

    // Verify description field
    expect(zodSchema.shape.description).toBeDefined()

    // Verify tags array
    expect(zodSchema.shape.tags).toBeDefined()
    expect(Array.isArray(testData.tags)).toBe(true)

    const { container } = render(
      <AI<SchemaObject, 'object'> schema={schema} prompt='Generate product details' output='object'>
        {(props: SchemaObject) => <div data-testid='content'>{props.description}</div>}
      </AI>,
    )

    // Initial render should be empty (loading state)
    expect(container.innerHTML).toBe('')
  })

  it('supports direct Zod schema usage', () => {
    const directSchema = z.object({
      title: z.string(),
      description: z.string(),
    })

    type DirectSchema = z.infer<typeof directSchema>

    const { container } = render(
      <AI<DirectSchema, 'object'> schema={directSchema} prompt='Generate content' output='object'>
        {(props: DirectSchema) => <div>{props.title}</div>}
      </AI>,
    )

    expect(container.innerHTML).toBe('')
  })

  it('validates schema structure matches example format', () => {
    const schema: SchemaObject = {
      productType: 'App | API | Marketplace | Platform | Packaged Service | Professional Service | Website',
      profile: {
        customer: 'ideal customer profile in 3-5 words',
        solution: 'describe the offer in 4-10 words',
      },
      description: 'website meta description',
      tags: ['SEO-optimized meta tags'],
    }

    const zodSchema = createSchemaFromObject(schema)

    // Verify schema structure
    expect(Object.keys(zodSchema.shape)).toEqual(['productType', 'profile', 'description', 'tags'])

    // Verify descriptions are preserved
    expect(zodSchema.shape.productType._def.description).toBe(schema.productType)
    expect((zodSchema.shape.profile as z.ZodObject<any>).shape.customer._def.description).toBe(schema.profile.customer)
    expect((zodSchema.shape.profile as z.ZodObject<any>).shape.solution._def.description).toBe(schema.profile.solution)
    expect(zodSchema.shape.description._def.description).toBe(schema.description)
    expect(zodSchema.shape.tags._def.description).toBe(schema.tags.join(', '))
  })
})

describe('Streaming and API Proxy', () => {
  const testSchema = z.object({
    title: z.string(),
    content: z.string(),
  })

  type TestSchema = z.infer<typeof testSchema>

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses streamObject when stream prop is true', async () => {
    const mockResponse = { title: 'Test', content: 'Content' }
    const mockStreamObject = vi.mocked(streamObject)
    const mockStreamResult: StreamObjectResult<typeof testSchema, typeof mockResponse> = {
      [Symbol.asyncIterator]: async function* () {
        yield {
          object: mockResponse,
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          warnings: [],
        }
      },
      warnings: [],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      experimental_providerMetadata: {},
      request: {
        prompt: 'Generate content',
        model: 'gpt-4',
        schema: testSchema,
        mode: 'json',
      },
    }
    mockStreamObject.mockImplementation(() => mockStreamResult)

    render(
      <AI<TestSchema, 'object'> prompt='Generate content' schema={testSchema} stream={true} output='object'>
        {(props: TestSchema) => (
          <div>
            <h1>{props.title}</h1>
            <p>{props.content}</p>
          </div>
        )}
      </AI>,
    )

    await waitFor(
      () => {
        expect(screen.getByText('Test')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    expect(streamObject).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Generate content',
        schema: expect.any(Object),
      }),
    )
  })

  it('uses API proxy when apiEndpoint is provided', async () => {
    const mockResponse = { title: 'API Test', content: 'API Content' }
    ;(global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ object: mockResponse }),
      status: 200,
    } as Response)

    render(
      <AI<TestSchema, 'object'>
        prompt='Generate content'
        schema={testSchema}
        apiEndpoint='/api/generate'
        headers={{ Authorization: 'Bearer test' }}
        output='object'
      >
        {(props: TestSchema) => (
          <div>
            <h1>{props.title}</h1>
            <p>{props.content}</p>
          </div>
        )}
      </AI>,
    )

    await waitFor(
      () => {
        expect(screen.getByText('API Test')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/generate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test',
        }),
      }),
    )
  })

  it('supports array output with streaming', async () => {
    const mockStreamObject = vi.mocked(streamObject)
    const mockStreamResult: StreamObjectResult<typeof testSchema, TestSchema[]> = {
      [Symbol.asyncIterator]: async function* () {
        const chunks = [
          {
            object: [{ title: 'Stream 1', content: 'Content 1' }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
            warnings: [],
          },
          {
            object: [
              { title: 'Stream 1', content: 'Content 1' },
              { title: 'Stream 2', content: 'Content 2' },
            ],
            usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 },
            warnings: [],
          },
        ]
        for (const chunk of chunks) {
          yield chunk
        }
      },
      warnings: [],
      usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 },
      experimental_providerMetadata: {},
      request: {
        prompt: 'Generate blog posts',
        model: 'gpt-4',
        schema: testSchema,
        mode: 'json',
      },
    }
    mockStreamObject.mockImplementation(() => mockStreamResult)

    render(
      <AI<TestSchema, 'array'> schema={testSchema} prompt='Generate test items' stream output='array'>
        {(props: TestSchema[]) => (
          <div>
            {props.map((item, index) => (
              <div key={index} data-testid={`stream-item-${index}`}>
                <h1>{item.title}</h1>
                <p>{item.content}</p>
              </div>
            ))}
          </div>
        )}
      </AI>,
    )

    await waitFor(
      () => {
        expect(screen.getByTestId('stream-item-0')).toHaveTextContent('Stream 1')
      },
      { timeout: 2000 },
    )

    await waitFor(
      () => {
        expect(screen.getByTestId('stream-item-1')).toHaveTextContent('Stream 2')
      },
      { timeout: 2000 },
    )
  })
})

describe('Child Component Validation', () => {
  const mockSchema = z.object({
    title: z.string(),
    description: z.string().min(10, 'Description must be at least 10 characters')
  })

  type MockSchema = z.infer<typeof mockSchema>

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('validates child props and regenerates on validation error', async () => {
    const invalidResponse = {
      object: {
        title: 'Test Post',
        description: 'Too short'
      }
    }

    const validResponse = {
      object: {
        title: 'Test Post',
        description: 'This is a proper length description that passes validation'
      }
    }

    ;(global.fetch as MockFetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
        status: 200,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => validResponse,
        status: 200,
      } as Response)

    render(
      <AI<MockSchema, 'object'>
        prompt='Generate a blog post'
        schema={mockSchema}
        validateProps={mockSchema}
        output='object'
      >
        {(props: MockSchema) => (
          <div data-testid='content'>
            <h1>{props.title}</h1>
            <p>{props.description}</p>
          </div>
        )}
      </AI>,
    )

    await waitFor(() => {
      const content = screen.getByTestId('content')
      expect(content).toBeInTheDocument()
      expect(content.querySelector('p')?.textContent).toBe(
        'This is a proper length description that passes validation'
      )
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('handles array output with validation', async () => {
    const validResponse = {
      object: [
        {
          title: 'Post 1',
          description: 'This is a valid description for post one'
        },
        {
          title: 'Post 2',
          description: 'This is a valid description for post two'
        }
      ]
    }

    ;(global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => validResponse,
      status: 200,
    } as Response)

    render(
      <AI<MockSchema, 'array'>
        prompt='Generate blog posts'
        schema={mockSchema}
        validateProps={mockSchema}
        output='array'
        count={2}
      >
        {(props: MockSchema[]) => (
          <div>
            {props.map((item, index) => (
              <div key={index} data-testid={`item-${index}`}>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </AI>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toBeInTheDocument()
      expect(screen.getByTestId('item-1')).toBeInTheDocument()
      expect(screen.getByText('This is a valid description for post one')).toBeInTheDocument()
      expect(screen.getByText('This is a valid description for post two')).toBeInTheDocument()
    })
  })

  it('extracts validation schema from nested objects', async () => {
    const nestedSchema = z.object({
      post: z.object({
        title: z.string(),
        content: z.object({
          description: z.string().min(10),
          tags: z.array(z.string()).min(1)
        })
      })
    })

    type NestedSchema = z.infer<typeof nestedSchema>

    const invalidResponse = {
      object: {
        post: {
          title: 'Test',
          content: {
            description: 'Short',
            tags: []
          }
        }
      }
    }

    const validResponse = {
      object: {
        post: {
          title: 'Test Post',
          content: {
            description: 'This is a proper length description',
            tags: ['test', 'validation']
          }
        }
      }
    }


    ;(global.fetch as MockFetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
        status: 200,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => validResponse,
        status: 200,
      } as Response)

    render(
      <AI<NestedSchema, 'object'>
        prompt='Generate a blog post'
        schema={nestedSchema}
        validateProps={nestedSchema}
        output='object'
      >
        {(props: NestedSchema) => (
          <div data-testid='nested-content'>
            <h1>{props.post.title}</h1>
            <p>{props.post.content.description}</p>
            <ul>
              {props.post.content.tags.map((tag, index) => (
                <li key={index}>{tag}</li>
              ))}
            </ul>
          </div>
        )}
      </AI>,
    )

    await waitFor(() => {
      const content = screen.getByTestId('nested-content')
      expect(content).toBeInTheDocument()
      expect(content.querySelector('p')?.textContent).toBe(
        'This is a proper length description'
      )
      expect(screen.getByText('test')).toBeInTheDocument()
      expect(screen.getByText('validation')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
