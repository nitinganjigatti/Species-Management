import { useEffect, useRef } from 'react';

const useInfiniteScroll = (callback, isLoading, hasMore) => {
  const elementRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          callback();
        }
      },
      { threshold: 1 }
    );

    const currentElement = elementRef.current;
    if (currentElement) observer.observe(currentElement);

    return () => {
      if (currentElement) observer.unobserve(currentElement);
      observer.disconnect();
    };
  }, [callback, isLoading, hasMore]);

  return elementRef;
};

export default useInfiniteScroll;
