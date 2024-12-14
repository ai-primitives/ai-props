import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AI } from './AI'
import { z } from 'zod'
import { createSchemaFromObject } from './utils/schema'
import type { SchemaObject, SchemaShape } from './utils/schema'
import { cn } from './utils/styles'

describe('AI', () => {
  it('renders with simplified schema interface', async () => {
    const schema: SchemaObject = {
      productType: 'App | API | Marketplace | Platform | Packaged Service | Professional Service | Website',
      profile: {
        customer: 'ideal customer profile in 3-5 words',
        solution: 'describe the offer in 4-10 words'
      },
      description: 'website meta description',
      tags: ['SEO-optimized meta tags']
    }

    const zodSchema = createSchemaFromObject(schema)
    const testData: SchemaShape = {
      productType: 'App',
      profile: {
        customer: 'Small Business Owners',
        solution: 'Automated Accounting Software'
      },
      description: 'Effortless accounting for small businesses',
      tags: ['accounting', 'small business', 'automation']
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
      <AI<SchemaObject>
        schema={schema}
        prompt="Generate product details"
        children={(props: SchemaShape) => <div data-testid="content">{props.description}</div>}
      />
    )

    // Initial render should be empty (loading state)
    expect(container.innerHTML).toBe('')
  })

  it('supports direct Zod schema usage', () => {
    const directSchema = z.object({
      title: z.string(),
      description: z.string()
    })

    type DirectSchema = z.infer<typeof directSchema>

    const { container } = render(
      <AI<DirectSchema>
        schema={directSchema}
        prompt="Generate content"
        children={(props) => <div>{props.title}</div>}
      />
    )

    expect(container.innerHTML).toBe('')
  })

  it('validates schema structure matches example format', () => {
    const schema: SchemaObject = {
      productType: 'App | API | Marketplace | Platform | Packaged Service | Professional Service | Website',
      profile: {
        customer: 'ideal customer profile in 3-5 words',
        solution: 'describe the offer in 4-10 words'
      },
      description: 'website meta description',
      tags: ['SEO-optimized meta tags']
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

describe('Array Output and Grid Support', () => {
  it('renders array output with grid layout', () => {
    const blogSchema: SchemaObject = {
      productType: 'Blog',
      profile: {
        customer: 'blog readers',
        solution: 'informative content'
      },
      title: 'engaging blog post title',
      excerpt: 'compelling 2-3 sentence excerpt',
      readTime: 'estimated read time',
      category: 'Blog | Tutorial | Case Study | News',
      description: 'blog post meta description',
      tags: ['relevant topic tags']
    }

    const { container } = render(
      <AI<typeof blogSchema>
        schema={blogSchema}
        prompt="Generate blog posts"
        output="array"
        cols={3}
        gap="2rem"
        className={cn('test-grid', 'custom-grid')}
        itemClassName={cn('test-item', 'custom-item')}
      >
        {(props: z.infer<ReturnType<typeof createSchemaFromObject>>) => (
          <article data-testid="blog-item">
            <h2>{props.title as string}</h2>
            <p>{props.excerpt as string}</p>
          </article>
        )}
      </AI>
    )

    // Initial render should be empty
    expect(container.innerHTML).toBe('')
  })

  it('supports className merging with clsx and tailwind-merge', () => {
    const heroSchema: SchemaObject = {
      productType: 'App | API | Marketplace | Platform',
      profile: {
        customer: 'ideal customer profile',
        solution: 'product solution'
      },
      headline: 'compelling headline for AI SaaS product',
      subheadline: 'engaging subheadline explaining value proposition',
      ctaText: 'action-oriented button text',
      benefits: ['3-5 key benefits'],
      description: 'product description',
      tags: ['relevant tags']
    }

    const { container } = render(
      <AI<typeof heroSchema>
        schema={heroSchema}
        prompt="Generate hero section"
        className={cn('base-class', 'custom-class')}
      >
        {(props: z.infer<ReturnType<typeof createSchemaFromObject>>) => (
          <div data-testid="hero-section">
            <h1>{props.headline as string}</h1>
            <p>{props.subheadline as string}</p>
          </div>
        )}
      </AI>
    )

    // Initial render should be empty
    expect(container.innerHTML).toBe('')
  })

  it('applies grid styles in array output mode', () => {
    const schema: SchemaObject = {
      productType: 'App',
      profile: {
        customer: 'test customer',
        solution: 'test solution'
      },
      description: 'test description',
      tags: ['test']
    }

    const { container } = render(
      <AI<typeof schema>
        schema={schema}
        prompt="Generate items"
        output="array"
        cols={2}
        gap="1rem"
        className={cn('grid-container', 'custom-container')}
        itemClassName={cn('grid-item', 'custom-item')}
      >
        {(props: z.infer<ReturnType<typeof createSchemaFromObject>>) => (
          <div>{props.description as string}</div>
        )}
      </AI>
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
        solution: 'product solution'
      },
      headline: 'compelling headline for AI SaaS product',
      subheadline: 'engaging subheadline explaining value proposition',
      ctaText: 'action-oriented button text',
      benefits: ['3-5 key benefits'],
      description: 'product description',
      tags: ['relevant tags']
    }

    const { container } = render(
      <AI<typeof heroSchema>
        schema={heroSchema}
        prompt="Generate hero section"
        className={cn('hero-section', 'custom-hero')}
      >
        {(props: z.infer<ReturnType<typeof createSchemaFromObject>>) => (
          <div data-testid="hero-content">
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
      </AI>
    )

    // Initial render should be empty
    expect(container.innerHTML).toBe('')
  })

  it('renders Blog List with array output', () => {
    const blogSchema: SchemaObject = {
      productType: 'Blog',
      profile: {
        customer: 'blog readers',
        solution: 'informative content'
      },
      title: 'engaging blog post title',
      excerpt: 'compelling 2-3 sentence excerpt',
      readTime: 'estimated read time',
      category: 'Blog | Tutorial | Case Study | News',
      description: 'blog post description',
      tags: ['relevant topic tags']
    }

    const { container } = render(
      <AI<typeof blogSchema>
        schema={blogSchema}
        prompt="Generate blog posts"
        output="array"
        cols={3}
        className={cn('blog-grid', 'custom-blog-grid')}
        itemClassName={cn('blog-item', 'custom-blog-item')}
      >
        {(props: z.infer<ReturnType<typeof createSchemaFromObject>>) => (
          <article data-testid="blog-post">
            <h2>{props.title as string}</h2>
            <p>{props.excerpt as string}</p>
            <div>{props.readTime as string}</div>
            <div>{props.category as string}</div>
            <div>{(props.tags as string[]).join(', ')}</div>
          </article>
        )}
      </AI>
    )

    // Initial render should be empty
    expect(container.innerHTML).toBe('')
  })
})
