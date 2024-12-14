import { BlogList } from './BlogList'
import { openai } from '@ai-sdk/openai'

export default {
  'Default Blog List': {
    component: BlogList,
    props: {
      model: openai('gpt-4o'),
      cols: 2,
      schema: {
        title: 'string',
        excerpt: 'string',
        readTime: 'string',
        category: 'Blog | Tutorial | Case Study | News',
        tags: ['string']
      }
    }
  },
  'Three Column Grid': {
    component: BlogList,
    props: {
      model: openai('gpt-4o'),
      cols: 3,
      schema: {
        title: 'string',
        excerpt: 'string',
        readTime: 'string',
        category: 'Blog | Tutorial | Case Study | News',
        tags: ['string']
      }
    }
  }
}
