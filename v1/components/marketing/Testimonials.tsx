import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Designer',
    company: 'TechCorp',
    image: '/avatars/sarah.jpg', // Placeholder
    content: 'Design Kit has become my go-to tool for quick image edits. The fact that everything happens in the browser means I never worry about privacy or upload times.',
    rating: 5,
  },
  {
    name: 'Michael Rodriguez',
    role: 'Freelance Designer',
    company: 'Self-employed',
    image: '/avatars/michael.jpg', // Placeholder
    content: 'As a freelancer, I handle sensitive client materials daily. Design Kit\'s client-side processing gives me peace of mind while delivering professional results.',
    rating: 5,
  },
  {
    name: 'Emma Thompson',
    role: 'Marketing Manager',
    company: 'StartupXYZ',
    image: '/avatars/emma.jpg', // Placeholder
    content: 'The speed is incredible! I can process dozens of images for social media in minutes. The background remover alone has saved me hours of work.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'UX Designer',
    company: 'DesignCo',
    image: '/avatars/david.jpg', // Placeholder
    content: 'Finally, a tool suite that respects user privacy. No more uploading sensitive designs to random servers. Design Kit is exactly what the industry needed.',
    rating: 5,
  },
  {
    name: 'Lisa Anderson',
    role: 'Content Creator',
    company: 'Creative Studio',
    image: '/avatars/lisa.jpg', // Placeholder
    content: 'The color picker and gradient generator are my favorite tools. They\'re fast, intuitive, and give me exactly what I need for my projects.',
    rating: 5,
  },
  {
    name: 'James Wilson',
    role: 'Web Developer',
    company: 'WebDev Agency',
    image: '/avatars/james.jpg', // Placeholder
    content: 'I love that I can resize and optimize images without leaving my workflow. The quality is excellent and it\'s incredibly fast. Highly recommend!',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="bg-muted/30 py-20 md:py-32">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Loved by Designers
          </h2>
          <p className="text-lg text-muted-foreground">
            See what professionals are saying about Design Kit
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.name}
              className="group relative transition-all hover:shadow-lg hover:scale-[1.02]"
              style={{
                animation: 'fade-in 0.5s ease-out',
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'backwards',
              }}
            >
              <CardContent className="pt-6">
                {/* Quote icon */}
                <Quote className="mb-4 h-8 w-8 text-primary/20" />

                {/* Rating */}
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="mb-6 text-sm text-muted-foreground">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust badge */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Join 10,000+ designers who trust Design Kit for their image processing needs
          </p>
        </div>
      </div>
    </section>
  )
}
