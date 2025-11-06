import { Upload, Wand2, Download, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Image',
    description: 'Select any image from your device. Files stay on your device—no server uploads.',
    step: 1,
  },
  {
    icon: Wand2,
    title: 'Choose Your Tool',
    description: 'Pick from our suite of professional tools: resize, crop, remove background, and more.',
    step: 2,
  },
  {
    icon: CheckCircle,
    title: 'Process Instantly',
    description: 'Watch as your image is processed in real-time, right in your browser.',
    step: 3,
  },
  {
    icon: Download,
    title: 'Download Result',
    description: 'Get your processed image instantly. Choose your preferred format and quality.',
    step: 4,
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Process your images in four simple steps—all in your browser
          </p>
        </div>

        <div className="relative">
          {/* Connection line - hidden on mobile */}
          <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 lg:block" />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className="group relative flex flex-col items-center text-center"
                  style={{
                    animation: 'slide-in-from-bottom 0.5s ease-out',
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: 'backwards',
                  }}
                >
                  {/* Step number */}
                  <div className="relative z-10 mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all group-hover:scale-110 group-hover:shadow-xl">
                    <Icon className="h-10 w-10 text-primary-foreground" />
                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background text-sm font-bold text-primary ring-2 ring-primary">
                      {step.step}
                    </div>
                  </div>

                  <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
