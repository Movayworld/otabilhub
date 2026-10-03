import Link from 'next/link'
import Image from 'next/image'
import { getHeroConfig } from '@/lib/queries/admin'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/6576991/pexels-photo-6576991.jpeg?auto=compress&cs=tinysrgb&w=1200&fit=max'
const FALLBACK_IMAGE_ALT = 'Premium electrical appliances and installation'

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
  heading: 'Premium Electrical Solutions',
  subheading: 'Quality electrical appliances, lighting, and smart technology for modern homes and businesses.',
  primary_cta_text: 'Shop Electrical Products',
  primary_cta_url: '/shop',
  secondary_cta_text: 'Installation Services',
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
    <section className="relative pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <p className="text-sm font-light tracking-widener text-[#1677FF] uppercase mb-4">
              OtabilHub Electrical
            </p>
            <h1
              className="font-display mt-4 text-4xl font-light tracking-tight text-[#0B1F33] sm:text-5xl lg:text-6xl"
              data-testid="hero-heading"
            >
              {headingLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0" data-testid="hero-subheading">
              {hero.subheading ||
                'Quality electrical appliances, lighting, and smart technology for modern homes and businesses.'}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href={hero.primary_cta_url || '/shop'}>
                <Button variant="primary" size="lg" data-testid="hero-primary-cta">
                  {hero.primary_cta_text || 'Shop Electrical Products'}
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

          <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg">
            <Image
              src={hero.image_url}
              alt={hero.image_alt || hero.heading}
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
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
