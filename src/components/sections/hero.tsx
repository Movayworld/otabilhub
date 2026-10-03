import Link from 'next/link'
import Image from 'next/image'
import { getHeroConfig } from '@/lib/queries/admin'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1545198580-9e93e2e64f1d?auto=compress&cs=tinysrgb&w=1200&fit=max'
const FALLBACK_IMAGE_ALT = 'Professional electrical equipment and installation materials'

type HeroContent = {
  image_url: string
  image_alt: string | null
  heading: string
  subheading: string | null
  primary_cta_text: string
  primary_cta_url: string
  secondary_cta_text: string | null
  secondary_cta_url: string | null
}

const FALLBACK_HERO: HeroContent = {
  image_url: FALLBACK_IMAGE,
  image_alt: FALLBACK_IMAGE_ALT,
  heading: 'Electrical Supplies & Technology',
  subheading: 'Everything you need for electrical, electronics, and installation work.',
  primary_cta_text: 'Shop Products',
  primary_cta_url: '/shop',
  secondary_cta_text: 'Our Services',
  secondary_cta_url: '/services',
}

export async function Hero() {
  const config = await getHeroConfig()

  const hero: HeroContent = config
    ? {
        image_url: config.image_url,
        image_alt: config.image_alt,
        heading: config.heading,
        subheading: config.subheading,
        primary_cta_text: config.primary_cta_text,
        primary_cta_url: config.primary_cta_url,
        secondary_cta_text: config.secondary_cta_text,
        secondary_cta_url: config.secondary_cta_url,
      }
    : FALLBACK_HERO

  const headingLines = hero.heading.split('\n').filter((line) => line.trim().length > 0)
  const showSecondaryCta = Boolean(hero.secondary_cta_text && hero.secondary_cta_url)

  return (
    <section className="bg-[#F5F7FA] py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="grid grid-cols-1 gap-12 items-center lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold tracking-wider text-[#1677FF] uppercase mb-6">
              OtabilHub Electrical
            </p>
            <h1
              className="text-3xl font-bold tracking-tight text-[#0B1F33] sm:text-4xl lg:text-5xl"
              data-testid="hero-heading"
            >
              {headingLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            {hero.subheading && (
              <p className="mt-4 text-lg text-gray-600" data-testid="hero-subheading">
                {hero.subheading}
              </p>
            )}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href={hero.primary_cta_url || '/shop'}>
                <Button variant="primary" size="lg" data-testid="hero-primary-cta">
                  {hero.primary_cta_text || 'Shop Products'}
                </Button>
              </Link>
              {showSecondaryCta && (
                <Link href={hero.secondary_cta_url!}>
                  <Button variant="outline" size="lg" data-testid="hero-secondary-cta">
                    {hero.secondary_cta_text}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="relative aspect-video w-full max-w-lg rounded-lg overflow-hidden bg-gray-100 shadow-sm">
            <Image
              src={hero.image_url}
              alt={hero.image_alt || hero.heading}
              fill
              sizes="(max-width: 1024px) 100vw, 500px"
              className="object-cover"
              data-testid="hero-image"
              priority
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
