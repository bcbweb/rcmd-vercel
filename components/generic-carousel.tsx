'use client';

import { ReactNode, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface GenericCarouselProps {
  items: ReactNode[];
  title?: string;
  cardsPerView?: 1 | 2 | 3 | 4;
}

const NavButton = ({
  direction,
  className
}: {
  direction: 'left' | 'right';
  className: string;
}) => {
  const Icon = direction === 'left' ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      className={`absolute top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg z-10 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      aria-label={direction === 'left' ? 'Previous slide' : 'Next slide'}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
};

export default function GenericCarousel({
  items,
  title,
  cardsPerView = 3
}: GenericCarouselProps) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const breakpoints = {
    320: {
      slidesPerView: 1,
      spaceBetween: 20
    },
    640: {
      slidesPerView: Math.min(2, cardsPerView),
      spaceBetween: 30
    },
    1024: {
      slidesPerView: cardsPerView,
      spaceBetween: 40
    }
  };

  return (
    <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {title && (
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          {title}
        </h2>
      )}

      <div className="relative">
        <Swiper
          modules={[Navigation, Pagination, A11y]}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          pagination={{
            clickable: true,
            bulletClass: 'swiper-pagination-bullet !bg-gray-400 dark:!bg-gray-600',
            bulletActiveClass: 'swiper-pagination-bullet-active !bg-gray-800 dark:!bg-gray-300',
          }}
          loop={true}
          breakpoints={breakpoints}
          onBeforeInit={(swiper) => {
            // @ts-expect-error - Swiper's type definitions don't properly handle the navigation parameters, but this is the correct way to initialize them
            swiper.params.navigation.prevEl = prevRef.current;
            // @ts-expect-error - Swiper's type definitions don't properly handle the navigation parameters, but this is the correct way to initialize them
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          className="!pb-12"
        >
          {items.map((item, index) => (
            <SwiperSlide key={index} className="h-auto">
              {item}
            </SwiperSlide>
          ))}
        </Swiper>

        <div ref={prevRef}>
          <NavButton direction="left" className="-left-4" />
        </div>
        <div ref={nextRef}>
          <NavButton direction="right" className="-right-4" />
        </div>
      </div>
    </div>
  );
}