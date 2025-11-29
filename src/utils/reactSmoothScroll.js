/**
 * React Scroll utility for smooth scrolling
 */

import { scroller } from 'react-scroll';

/**
 * Scroll to element using react-scroll
 */
export function scrollToElement(element, container, options = {}) {
  const {
    duration = 2000,
    delay = 0,
    smooth = true,
    offset = -20,
    spy = false,
    exact = 'true',
    activeClass = 'active'
  } = options;

  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    // Generate a unique ID for the element if it doesn't have one
    const elementId = element.id || `scroll-target-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Temporarily set the ID
    const originalId = element.id;
    element.id = elementId;

    // Scroll to the element
    scroller.scrollTo(elementId, {
      duration,
      delay,
      smooth,
      offset,
      spy,
      exact,
      activeClass,
      container: container ? container : 'body'
    });

    // Restore original ID
    setTimeout(() => {
      element.id = originalId;
      resolve();
    }, duration + delay);
  });
}

/**
 * Scroll to next element in array
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
 * Animate scroll to specific position
 */
export function scrollToPosition(position, container, options = {}) {
  const {
    duration = 2000,
    delay = 0,
    smooth = true
  } = options;

  return new Promise((resolve) => {
    if (container) {
      const startScrollTop = container.scrollTop;
      const distance = position - startScrollTop;
      const startTime = performance.now();

      const animateScroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic ease-in-out
        const easeProgress = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const currentScrollTop = startScrollTop + (distance * easeProgress);
        container.scrollTop = currentScrollTop;
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animateScroll);
    } else {
      window.scrollTo({
        top: position,
        behavior: smooth ? 'smooth' : 'auto'
      });
      setTimeout(resolve, duration);
    }
  });
}
