"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, ReactNode, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CompactCarouselProps {
  items: ReactNode[];
  cardsPerView?: 1 | 2;
}

export default function CompactCarousel({
  items,
  cardsPerView = 1,
}: CompactCarouselProps) {
  // Configure based on cards per view
  const getSlideSpacing = () => {
    return {
      1: "space-x-3",
      2: "space-x-3",
    }[cardsPerView];
  };

  const getSlideSize = () => {
    return {
      1: "w-full",
      2: "w-[calc(50%-0.5rem)]",
    }[cardsPerView];
  };

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
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
    <section className="w-full py-2">
      <div className="relative">
        {/* Carousel Container */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className={`flex ${getSlideSpacing()} ml-2 -mr-2 py-2`}>
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
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md transition-all ${
                prevBtnEnabled
                  ? "opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>

            <button
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              aria-label="Next slide"
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md transition-all ${
                nextBtnEnabled
                  ? "opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
