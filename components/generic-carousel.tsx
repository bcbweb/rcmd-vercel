'use client';

import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType } from 'embla-carousel';
import { useCallback, ReactNode, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const options: EmblaOptionsType = {
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    dragFree: false,
    containScroll: false,
  };

  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const getCardWidth = (cards: number) => {
    switch (cards) {
      case 1:
        return 'w-full';
      case 2:
        return 'w-full md:w-1/2';
      case 3:
        return 'w-full md:w-1/3';
      case 4:
        return 'w-full md:w-1/3 lg:w-1/4';
      default:
        return 'w-full md:w-1/3';
    }
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            {title}
          </h2>
        )}

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`${getCardWidth(cardsPerView)} flex-shrink-0 px-[2px]`}
                >
                  <div className="h-full">{item}</div>
                </div>
              ))}
            </div>
          </div>

          {items.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                disabled={!prevBtnEnabled}
                aria-label="Previous slide"
                className={`absolute left-0 top-1/2 -translate-y-1/2 -ml-2 sm:-ml-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg z-10 transition-all ${prevBtnEnabled
                  ? 'opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'opacity-50 cursor-not-allowed'
                  }`}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
              </button>

              <button
                onClick={scrollNext}
                disabled={!nextBtnEnabled}
                aria-label="Next slide"
                className={`absolute right-0 top-1/2 -translate-y-1/2 -mr-2 sm:-mr-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg z-10 transition-all ${nextBtnEnabled
                  ? 'opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'opacity-50 cursor-not-allowed'
                  }`}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}