import { z } from 'zod'

export type ProfileObject = {
  customer: string
  solution: string
}

export type SchemaShape = {
  productType: string
  profile: ProfileObject
  description: string
  tags: string[]
}

export interface SchemaObject extends SchemaShape {
  [key: string]: string | string[] | ProfileObject | undefined
}

export type SchemaZodShape = {
  productType: z.ZodEnum<[string, ...string[]]> | z.ZodString
  profile: z.ZodObject<{
    customer: z.ZodString
    solution: z.ZodString
  }>
  description: z.ZodString
  tags: z.ZodArray<z.ZodString>
}

function convertToZodSchema(schema: SchemaObject): z.ZodObject<SchemaZodShape> {
  const zodSchema = {
    productType: typeof schema.productType === 'string' && schema.productType.includes('|')
      ? z.enum(schema.productType.split('|').map(v => v.trim()) as [string, ...string[]]).describe(schema.productType)
      : z.string().describe(schema.productType),
    profile: z.object({
      customer: z.string().describe(schema.profile.customer),
      solution: z.string().describe(schema.profile.solution)
    }),
    description: z.string().describe(schema.description),
    tags: z.array(z.string()).describe(schema.tags.join(', '))
  } satisfies SchemaZodShape

  return z.object(zodSchema)
}

export function createSchemaFromObject(schema: SchemaObject): z.ZodObject<SchemaZodShape> {
  return convertToZodSchema(schema)
}

export function isZodSchema(value: unknown): value is z.ZodSchema {
  return value instanceof z.ZodType
}
