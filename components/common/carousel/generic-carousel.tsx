"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, ReactNode, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GenericCarouselProps {
  items: ReactNode[];
  title?: string;
  cardsPerView?: 1 | 2 | 3 | 4;
}

export default function GenericCarousel({
  items,
  title,
  cardsPerView = 3,
}: GenericCarouselProps) {
  // Configure based on cards per view
  const getSlideSpacing = () => {
    return {
      1: "space-x-0",
      2: "space-x-4 md:space-x-6",
      3: "space-x-4 md:space-x-6",
      4: "space-x-3 md:space-x-4 lg:space-x-6",
    }[cardsPerView];
  };

  const getSlideSize = () => {
    return {
      1: "w-full",
      2: "w-[calc(100%-1rem)] sm:w-[calc(50%-1rem)]",
      3: "w-[calc(100%-1rem)] sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)]",
      4: "w-[calc(100%-1rem)] sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1rem)]",
    }[cardsPerView];
  };

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    dragFree: false,
    skipSnaps: false,
    inViewThreshold: 0.7,
  });

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
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (items.length === 0) return null;

  return (
    <section className="w-full py-8">
      <div className="max-w-[1400px] mx-auto">
        {title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            {title}
          </h2>
        )}

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className={`flex ${getSlideSpacing()} ml-4 -mr-4 py-4`}>
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`${getSlideSize()} flex-shrink-0 min-h-[100px]`}
                >
                  <div className="h-full">{item}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          {items.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                disabled={!prevBtnEnabled}
                aria-label="Previous slide"
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg transition-all ${
                  prevBtnEnabled
                    ? "opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              <button
                onClick={scrollNext}
                disabled={!nextBtnEnabled}
                aria-label="Next slide"
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg transition-all ${
                  nextBtnEnabled
                    ? "opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
