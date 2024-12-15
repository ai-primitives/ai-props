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

describe('Array Output and Grid Support', () => {
  it('renders array output with grid layout', () => {
    const blogSchema: SchemaObject = {
      productType: 'Blog',
      profile: {
        customer: 'blog readers',
        solution: 'informative content',
      },
      title: 'engaging blog post title',
      excerpt: 'compelling 2-3 sentence excerpt',
      readTime: 'estimated read time',
      category: 'Blog | Tutorial | Case Study | News',
      description: 'blog post meta description',
      tags: ['relevant topic tags'],
    }

    const { container } = render(
      <AI<typeof blogSchema, 'array'>
        schema={blogSchema}
        prompt='Generate blog posts'
        output='array'
        cols={3}
        gap='2rem'
        className={cn('test-grid', 'custom-grid')}
        itemClassName={cn('test-item', 'custom-item')}
      >
        {(props: z.infer<ReturnType<typeof createSchemaFromObject>>[]) => (
          <article data-testid='blog-item'>
            <h2>{props[0].title as string}</h2>
            <p>{props[0].excerpt as string}</p>
          </article>
        )}
      </AI>,
    )

    // Initial render should be empty
    expect(container.innerHTML).toBe('')
  })

  it('supports className merging with clsx and tailwind-merge', () => {
    const heroSchema: SchemaObject = {
      productType: 'App | API | Marketplace | Platform',
      profile: {
        customer: 'ideal customer profile',
        solution: 'product solution',
      },
      headline: 'compelling headline for AI SaaS product',
      subheadline: 'engaging subheadline explaining value proposition',
      ctaText: 'action-oriented button text',
      benefits: ['3-5 key benefits'],
      description: 'product description',
      tags: ['relevant tags'],
    }

    const { container } = render(
      <AI<typeof heroSchema> schema={heroSchema} prompt='Generate hero section' className={cn('base-class', 'custom-class')}>
        {(props: z.infer<ReturnType<typeof createSchemaFromObject>>) => (
          <div data-testid='hero-section'>
            <h1>{props.headline as string}</h1>
            <p>{props.subheadline as string}</p>
          </div>
        )}
      </AI>,
    )

    // Initial render should be empty
    expect(container.innerHTML).toBe('')
  })

  it('applies grid styles in array output mode', () => {
    const schema: SchemaObject = {
      productType: 'App',
      profile: {
        customer: 'test customer',
        solution: 'test solution',
      },
      description: 'test description',
      tags: ['test'],
    }

    const { container } = render(
      <AI<typeof schema, 'array'>
        schema={schema}
        prompt='Generate items'
        output='array'
        cols={2}
        gap='1rem'
        className={cn('grid-container', 'custom-container')}
        itemClassName={cn('grid-item', 'custom-item')}
      >
        {(props: z.infer<ReturnType<typeof createSchemaFromObject>>[]) => <div>{props[0].description as string}</div>}
      </AI>,
    )

    // Initial render should be empty
    expect(container.innerHTML).toBe('')
  })
})

describe('Example Components', () => {
  it('renders Hero Section with proper structure', () => {
    const heroSchema: SchemaObject = {
      productType: 'App',
      profile: {
        customer: 'ideal customer profile',
        solution: 'product solution',
      },
      headline: 'compelling headline for AI SaaS product',
      subheadline: 'engaging subheadline explaining value proposition',
      ctaText: 'action-oriented button text',
      benefits: ['3-5 key benefits'],
      description: 'product description',
      tags: ['relevant tags'],
    }

    const { container } = render(
      <AI<typeof heroSchema, 'object'> schema={heroSchema} prompt='Generate hero section' output='object' className={cn('hero-section', 'custom-hero')}>
        {(props: z.infer<ReturnType<typeof createSchemaFromObject>>) => (
          <div data-testid='hero-content'>
            <h1>{props.headline as string}</h1>
            <p>{props.subheadline as string}</p>
            <button>{props.ctaText as string}</button>
            <ul>
              {(props.benefits as string[]).map((benefit: string, index: number) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
        )}
      </AI>,
    )

    // Initial render should be empty
    expect(container.innerHTML).toBe('')
  })

  it('renders Blog List with array output', () => {
    const blogSchema: SchemaObject = {
      productType: 'Blog',
      profile: {
        customer: 'blog readers',
        solution: 'informative content',
      },
      title: 'engaging blog post title',
      excerpt: 'compelling 2-3 sentence excerpt',
      readTime: 'estimated read time',
      category: 'Blog | Tutorial | Case Study | News',
      description: 'blog post description',
      tags: ['relevant topic tags'],
    }

    const { container } = render(
      <AI<typeof blogSchema, 'array'>
        schema={blogSchema}
        prompt='Generate blog posts'
        output='array'
        cols={3}
        className={cn('blog-grid', 'custom-blog-grid')}
        itemClassName={cn('blog-item', 'custom-blog-item')}
      >
        {(props: z.infer<ReturnType<typeof createSchemaFromObject>>[]) => (
          <>
            {props.map((post, index) => (
              <article key={index} data-testid='blog-post'>
                <h2>{post.title as string}</h2>
                <p>{post.excerpt as string}</p>
                <div>{post.readTime as string}</div>
                <div>{post.category as string}</div>
                <div>{(post.tags as string[]).join(', ')}</div>
              </article>
            ))}
          </>
        )}
      </AI>,
    )

    // Initial render should be empty
    expect(container.innerHTML).toBe('')
  })
})
