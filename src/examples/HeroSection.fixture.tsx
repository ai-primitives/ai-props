import { HeroSection } from './HeroSection'
import { openai } from '@ai-sdk/openai'

export default {
  'Default Hero': {
    component: HeroSection,
    props: {
      model: openai('gpt-4o'),
      schema: {
        headline: 'string',
        subheadline: 'string',
        ctaText: 'string',
        benefits: ['string'],
        targetAudience: 'string'
      }
    }
  },
  'Custom Model': {
    component: HeroSection,
    props: {
      model: openai('gpt-3.5-turbo'),
      schema: {
        headline: 'string',
        subheadline: 'string',
        ctaText: 'string',
        benefits: ['string'],
        targetAudience: 'string'
      }
    }
  }
}
