import { Shield, Zap, Palette, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Shield,
    title: 'Privacy-First Processing',
    description: 'Client-side tools process files entirely in your browser. Your images never leave your device.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'No uploads, no waiting. Process images instantly with browser-native performance.',
  },
  {
    icon: Palette,
    title: 'Professional Tools',
    description: 'From color picking to image resizing, get the tools designers use every day.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Features',
    description: 'Advanced tools like background removal and image upscaling powered by cutting-edge AI.',
  },
]

export function Features() {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Why Choose Design Kit?
          </h2>
          <p className="text-lg text-muted-foreground">
            Built for designers who value privacy, speed, and professional results
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="group border-2 transition-all hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
