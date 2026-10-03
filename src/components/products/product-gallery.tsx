'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryImage {
  id: string
  url: string
  alt: string | null
}

interface ProductGalleryProps {
  images: GalleryImage[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">No images available</p>
      </div>
    )
  }

  const currentImage = images[currentImageIndex]
  const hasMultipleImages = images.length > 1

  const goToPrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    )
  }

  return (
    <div className="w-full">
      <div className="relative mb-4 aspect-[3/4] w-full overflow-hidden bg-gray-50 sm:aspect-[16/9]">
        {currentImage.url ? (
          <Image
            src={currentImage.url}
            alt={currentImage.alt || productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4 transition-opacity duration-300"
            priority={currentImageIndex === 0}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <span className="text-sm">No image</span>
          </div>
        )}

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:ring-offset-2"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#1677FF] focus:ring-offset-2"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="grid grid-cols-6 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setCurrentImageIndex(index)}
              className={cn(
                'relative aspect-square w-full overflow-hidden rounded-md bg-gray-50 border-2 transition-all',
                  index === currentImageIndex
                  ? 'border-[#1677FF]'
                  : 'border-transparent hover:border-gray-300'
              )}
              aria-label={`View image ${index + 1} of ${images.length}`}
            >
              {image.url ? (
                <Image
                  src={image.url}
                  alt={image.alt || `Product image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 16vw, 10vw"
                  className="object-contain p-1"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <span className="text-xs">No image</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
