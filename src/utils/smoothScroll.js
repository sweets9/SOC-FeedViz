/**
 * Smooth scrolling utility with advanced easing and performance optimizations
 */

// Easing functions for different animation styles
export const easingFunctions = {
  // Linear - constant speed
  linear: t => t,
  
  // Quadratic - acceleration then deceleration
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  // Cubic - smoother acceleration/deceleration
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  // Exponential - dramatic acceleration/deceleration
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  
  // Back - overshoot effect
  easeInBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: t => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  
  // Elastic - springy effect
  easeOutElastic: t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

/**
 * Advanced smooth scroll implementation
 */
export class SmoothScroller {
  constructor(options = {}) {
    this.options = {
      duration: 2000,
      easing: 'easeInOutCubic',
      offset: 20,
      minDuration: 300,
      maxDuration: 3000,
      adaptiveDuration: true,
      ...options
    };
    
    this.isScrolling = false;
    this.animationId = null;
    this.startY = 0;
    this.targetY = 0;
    this.startTime = 0;
  }

  /**
   * Scroll to a specific element or position
   */
  scrollTo(target, container = window, options = {}) {
    const config = { ...this.options, ...options };
    
    // Cancel any existing scroll
    this.cancel();
    
    // Determine target position
    let targetY;
    if (typeof target === 'number') {
      targetY = target;
    } else if (target && target.offsetTop !== undefined) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      targetY = container.scrollTop + (targetRect.top - containerRect.top) - config.offset;
    } else {
      console.warn('[SmoothScroller] Invalid target:', target);
      return Promise.resolve();
    }

    // Calculate adaptive duration based on distance
    let duration = config.duration;
    if (config.adaptiveDuration && container.scrollTop !== undefined) {
      const distance = Math.abs(targetY - container.scrollTop);
      const minDistance = 100;
      const maxDistance = 2000;
      
      if (distance < minDistance) {
        duration = config.minDuration;
      } else if (distance > maxDistance) {
        duration = config.maxDuration;
      } else {
        // Scale duration based on distance
        const ratio = (distance - minDistance) / (maxDistance - minDistance);
        duration = config.minDuration + (config.maxDuration - config.minDuration) * ratio;
      }
    }

    return new Promise((resolve) => {
      this.startY = container.scrollTop || window.pageYOffset;
      this.targetY = targetY;
      this.startTime = performance.now();
      this.isScrolling = true;

      const animate = (currentTime) => {
        if (!this.isScrolling) {
          resolve();
          return;
        }

        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply easing function
        const easedProgress = easingFunctions[config.easing](progress);
        
        // Calculate current position
        const currentY = this.startY + (this.targetY - this.startY) * easedProgress;
        
        // Apply scroll
        if (container.scrollTop !== undefined) {
          container.scrollTop = currentY;
        } else {
          window.scrollTo(0, currentY);
        }
        
        // Continue animation or complete
        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate);
        } else {
          this.isScrolling = false;
          this.animationId = null;
          resolve();
        }
      };

      this.animationId = requestAnimationFrame(animate);
    });
  }

  /**
   * Scroll to the next element in a container
   */
  scrollToNext(elements, container, options = {}) {
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
    
    return this.scrollTo(nextElement, container, options);
  }

  /**
   * Cancel current scroll animation
   */
  cancel() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isScrolling = false;
  }

  /**
   * Check if currently scrolling
   */
  get isScrollingActive() {
    return this.isScrolling;
  }
}

// Create a default instance
export const smoothScroller = new SmoothScroller();

/**
 * Quick scroll functions using the default instance
 */
export const scrollToElement = (element, container, options) => 
  smoothScroller.scrollTo(element, container, options);

export const scrollToNext = (elements, container, options) => 
  smoothScroller.scrollToNext(elements, container, options);

export const cancelScroll = () => smoothScroller.cancel();

export const isScrolling = () => smoothScroller.isScrollingActive;
