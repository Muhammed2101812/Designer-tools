import { Users, Image, Zap, Award } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '10,000+',
    label: 'Active Users',
    description: 'Designers trust our tools',
  },
  {
    icon: Image,
    value: '500K+',
    label: 'Images Processed',
    description: 'Securely in browsers',
  },
  {
    icon: Zap,
    value: '< 1s',
    label: 'Average Process Time',
    description: 'Lightning fast results',
  },
  {
    icon: Award,
    value: '99.9%',
    label: 'Satisfaction Rate',
    description: 'Users love our tools',
  },
]

export function Stats() {
  return (
    <section className="border-y bg-muted/30 py-16 md:py-20">
      <div className="container">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="group flex flex-col items-center text-center transition-transform hover:scale-105"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <div className="mb-1 text-3xl font-bold tracking-tight md:text-4xl">
                  {stat.value}
                </div>
                <div className="mb-1 text-sm font-semibold text-foreground">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.description}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
