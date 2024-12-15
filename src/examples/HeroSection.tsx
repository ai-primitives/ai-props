import { AI } from '../AI'
import type { SchemaObject } from '../utils/schema'

type HeroSchema = SchemaObject & {
  headline: string
  subheadline: string
  ctaText: string
  benefits: string[]
  targetAudience: string
}

const heroSchema: HeroSchema = {
  productType: 'App | API | Marketplace | Platform | Packaged Service | Professional Service | Website',
  profile: {
    customer: 'ideal customer profile in 3-5 words',
    solution: 'describe the offer in 4-10 words',
  },
  description: 'website meta description',
  tags: ['SEO-optimized meta tags'],
  headline: 'compelling headline for AI SaaS product',
  subheadline: 'engaging subheadline explaining value proposition',
  ctaText: 'action-oriented button text',
  benefits: ['3-5 key benefits'],
  targetAudience: 'specific target audience description',
}

export function HeroSection(): JSX.Element {
  return (
    <AI<HeroSchema, 'object'>
      schema={heroSchema}
      prompt='Generate a hero section for an AI-powered SaaS product waitlist landing page'
      output='object'
      className='bg-gradient-to-br from-blue-50 to-indigo-50'
    >
      {(props: HeroSchema) => (
        <div className='max-w-6xl mx-auto px-4 py-16'>
          <h1 className='text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600'>{props.headline}</h1>
          <p className='text-xl text-gray-600 mb-8'>{props.subheadline}</p>
          <button className='bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors'>{props.ctaText}</button>
          <div className='mt-12'>
            <h2 className='text-2xl font-semibold mb-4'>Perfect for {props.targetAudience}</h2>
            <ul className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {props.benefits.map((benefit: string, index: number) => (
                <li key={index} className='flex items-start bg-white p-4 rounded-lg shadow-sm'>
                  <span className='text-blue-500 mr-2'>✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </AI>
  )
}
