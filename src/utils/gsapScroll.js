/**
 * GSAP ScrollTrigger utility for advanced smooth scrolling
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scroll to element using GSAP
 */
export function scrollToElement(element, container, options = {}) {
  const {
    duration = 2,
    ease = 'power2.inOut',
    offset = 20,
    onComplete = null,
    onStart = null
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

    // Create timeline for scroll animation
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
        resolve();
      },
      onStart: () => {
        if (onStart) onStart();
      }
    });

    // Animate the scroll position
    tl.to(container, {
      scrollTop: targetScrollTop,
      duration,
      ease
    }, 0);

    return tl;
  });
}

/**
 * Scroll to next element in array using GSAP
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
 * Create continuous auto-scroll with GSAP
 */
export function createAutoScroll(container, elements, options = {}) {
  const {
    duration = 2,
    ease = 'power2.inOut',
    offset = 20,
    interval = 6000,
    autoScroll = true,
    isPaused = false
  } = options;

  let currentIndex = 0;
  let autoScrollTimeline = null;
  let intervalId = null;
  let isScrolling = false;

  const scrollToNextElement = () => {
    if (isPaused || !autoScroll || isScrolling || elements.length === 0) {
      return;
    }

    isScrolling = true;
    const nextElement = elements[currentIndex];
    
    scrollToElement(nextElement, container, {
      duration,
      ease,
      offset,
      onStart: () => {
        console.log(`[GSAP] Auto-scrolling to element ${currentIndex + 1}/${elements.length}`);
      },
      onComplete: () => {
        isScrolling = false;
        currentIndex = (currentIndex + 1) % elements.length;
      }
    });
  };

  const start = () => {
    // Start the interval
    intervalId = setInterval(scrollToNextElement, interval);
    // Scroll to first element immediately
    scrollToNextElement();
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (autoScrollTimeline) {
      autoScrollTimeline.kill();
      autoScrollTimeline = null;
    }
    isScrolling = false;
  };

  const pause = () => {
    if (autoScrollTimeline) {
      autoScrollTimeline.pause();
    }
  };

  const resume = () => {
    if (autoScrollTimeline) {
      autoScrollTimeline.resume();
    }
  };

  // Auto-start if enabled
  if (autoScroll && !isPaused) {
    start();
  }

  return {
    start,
    stop,
    pause,
    resume,
    scrollToNext: scrollToNextElement,
    isScrolling: () => isScrolling
  };
}

/**
 * Create ScrollTrigger-based animations for elements
 */
export function createScrollTriggerAnimations(elements, options = {}) {
  const {
    start = 'top center',
    end = 'bottom center',
    scrub = true,
    markers = false,
    onEnter = null,
    onLeave = null,
    onEnterBack = null,
    onLeaveBack = null
  } = options;

  const triggers = [];

  elements.forEach((element, index) => {
    const trigger = ScrollTrigger.create({
      trigger: element,
      start,
      end,
      scrub,
      markers,
      onEnter: () => {
        console.log(`[GSAP] Element ${index + 1} entered viewport`);
        if (onEnter) onEnter(element, index);
      },
      onLeave: () => {
        console.log(`[GSAP] Element ${index + 1} left viewport`);
        if (onLeave) onLeave(element, index);
      },
      onEnterBack: () => {
        console.log(`[GSAP] Element ${index + 1} entered from bottom`);
        if (onEnterBack) onEnterBack(element, index);
      },
      onLeaveBack: () => {
        console.log(`[GSAP] Element ${index + 1} left from bottom`);
        if (onLeaveBack) onLeaveBack(element, index);
      }
    });

    triggers.push(trigger);
  });

  return {
    refresh: () => ScrollTrigger.refresh(),
    kill: () => triggers.forEach(trigger => trigger.kill()),
    triggers
  };
}

/**
 * Cleanup all GSAP ScrollTrigger instances
 */
export function cleanupScrollTriggers() {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  ScrollTrigger.refresh();
}

// Export GSAP and ScrollTrigger for advanced usage
export { gsap, ScrollTrigger };
