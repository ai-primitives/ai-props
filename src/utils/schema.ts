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
  [key: string]: unknown
}

export interface SchemaObject extends SchemaShape {
  [key: string]: string | string[] | ProfileObject | Record<string, unknown> | unknown
}

export type SchemaZodShape = {
  productType: z.ZodEnum<[string, ...string[]]> | z.ZodString
  profile: z.ZodObject<{
    customer: z.ZodString
    solution: z.ZodString
  }>
  description: z.ZodString
  tags: z.ZodArray<z.ZodString>
  [key: string]: z.ZodTypeAny
}

function convertToZodSchema(schema: SchemaObject): z.ZodObject<SchemaZodShape> {
  const zodSchema: Record<string, z.ZodTypeAny> = {}

  for (const [key, value] of Object.entries(schema)) {
    if (key === 'profile' && typeof value === 'object' && value !== null && 'customer' in value && 'solution' in value) {
      zodSchema[key] = z.object({
        customer: z.string().describe((value as ProfileObject).customer),
        solution: z.string().describe((value as ProfileObject).solution),
      })
    } else if (Array.isArray(value)) {
      zodSchema[key] = z.array(z.string()).describe(value.join(', '))
    } else if (typeof value === 'string') {
      zodSchema[key] = value.includes('|') ? z.enum(value.split('|').map((v) => v.trim()) as [string, ...string[]]).describe(value) : z.string().describe(value)
    }
  }

  return z.object(zodSchema) as z.ZodObject<SchemaZodShape>
}

export function createSchemaFromObject(schema: SchemaObject): z.ZodObject<SchemaZodShape> {
  return convertToZodSchema(schema)
}

export function isZodSchema(value: unknown): value is z.ZodSchema {
  return value instanceof z.ZodType
}
