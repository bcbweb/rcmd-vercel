'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface GenericCarouselProps {
  items: ReactNode[];
  title?: string;
  cardsPerView?: 1 | 2 | 3 | 4;
}

export default function GenericCarousel({
  items,
  title,
  cardsPerView = 3
}: GenericCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    dragFree: true,
  });

  const getCardWidth = (cards: number) => {
    switch (cards) {
      case 1:
        return 'flex-[0_0_100%]';
      case 2:
        return 'flex-[0_0_100%] sm:flex-[0_0_50%]';
      case 3:
        return 'flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]';
      case 4:
        return 'flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_25%]';
      default:
        return 'flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]';
    }
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {title && (
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          {title}
        </h2>
      )}

      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {items.map((item, index) => (
              <div
                key={index}
                className={`${getCardWidth(cardsPerView)} min-w-0 pb-4`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={scrollPrev}
          aria-label="Previous slide"
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg z-10 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>

        <button
          onClick={scrollNext}
          aria-label="Next slide"
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg z-10 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}