import { AI } from '../AI'
import type { SchemaObject } from '../utils/schema'

type BlogSchema = SchemaObject & {
  title: string
  excerpt: string
  readTime: string
  category: string
  tags: string[]
}

const blogSchema: BlogSchema = {
  productType: 'App | API | Marketplace | Platform | Packaged Service | Professional Service | Website',
  profile: {
    customer: 'ideal customer profile in 3-5 words',
    solution: 'describe the offer in 4-10 words'
  },
  description: 'website meta description',
  tags: ['relevant topic tags'],
  title: 'engaging blog post title',
  excerpt: 'compelling 2-3 sentence excerpt',
  readTime: 'estimated read time',
  category: 'Blog | Tutorial | Case Study | News'
}

export function BlogList(): JSX.Element {
  return (
    <AI<BlogSchema, 'array'>
      schema={blogSchema}
      prompt="Generate 6 blog post previews about AI and machine learning"
      output="array"
      cols={3}
      gap="2rem"
      className="max-w-7xl mx-auto px-4 py-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      itemClassName="h-full"
    >
      {(props: BlogSchema[]) => (
        <>
          {props.map((post, index) => (
            <article key={index} className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
              <div className="text-sm text-gray-500 mb-2 flex items-center justify-between">
                <span>{post.category}</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-xl font-semibold mb-3">{post.title}</h2>
              <p className="text-gray-600 mb-4 flex-grow">{post.excerpt}</p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {post.tags.map((tag: string, tagIndex: number) => (
                  <span key={tagIndex} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </>
      )}
    </AI>
  )
}
