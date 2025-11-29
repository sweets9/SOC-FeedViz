/**
 * Simple reliable smooth scroll implementation
 */

import smoothscroll from 'smoothscroll-polyfill';

// Initialize the polyfill
smoothscroll.polyfill();

/**
 * Smooth scroll to element with options
 */
export function scrollToElement(element, container, options = {}) {
  const {
    duration = 2000,
    offset = 20,
    behavior = 'smooth'
  } = options;

  return new Promise((resolve) => {
    if (!element || !container) {
      resolve();
      return;
    }

    // Calculate target position
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const targetScrollTop = container.scrollTop + (elementRect.top - containerRect.top) - offset;

    // Use native smooth scroll with fallback
    try {
      container.scrollTo({
        top: targetScrollTop,
        behavior: behavior
      });

      // Wait for scroll to complete (approximate)
      setTimeout(resolve, duration);
    } catch (error) {
      // Fallback for browsers that don't support smooth scroll
      container.scrollTop = targetScrollTop;
      resolve();
    }
  });
}

/**
 * Smooth scroll to next element in array
 */
export function scrollToNext(elements, container, options = {}) {
  if (!elements || elements.length === 0) {
    return Promise.resolve();
  }

  const containerRect = container.getBoundingClientRect();
  const containerCenter = containerRect.top + containerRect.height / 2;
  
  // Find the next element that's below the center
  let nextElement = null;
  let minDistance = Infinity;
  
  for (const element of elements) {
    const elementRect = element.getBoundingClientRect();
    const elementCenter = elementRect.top + elementRect.height / 2;
    const distance = elementCenter - containerCenter;
    
    if (distance > 0 && distance < minDistance) {
      minDistance = distance;
      nextElement = element;
    }
  }
  
  // If no element found below center, scroll to first element
  if (!nextElement && elements.length > 0) {
    nextElement = elements[0];
  }
  
  return scrollToElement(nextElement, container, options);
}

/**
 * Simple scroll animation using requestAnimationFrame
 */
export function animateScroll(container, from, to, duration = 2000) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-in-out
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      const currentScrollTop = from + (to - from) * easeProgress;
      container.scrollTop = currentScrollTop;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
}
