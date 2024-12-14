import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AI } from './AI'
import { z } from 'zod'
import { createSchemaFromObject } from './utils/schema'
import type { SchemaObject, SchemaShape } from './utils/schema'

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
