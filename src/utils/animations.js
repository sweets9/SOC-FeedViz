/**
 * Animation utilities using Framer Motion for smooth transitions
 */

import { motion, AnimatePresence } from 'framer-motion';

/**
 * Smooth scroll to element using requestAnimationFrame
 */
export function smoothScrollTo(element, container, duration = 1000) {
  return new Promise((resolve) => {
    if (!element || !container) {
      resolve();
      return;
    }

    const containerPaddingTop = 60;
    const elementTop = element.offsetTop;
    const containerTop = container.scrollTop;
    const targetScroll = elementTop - containerPaddingTop;
    const start = containerTop;
    const distance = targetScroll - start;

    if (Math.abs(distance) < 1) {
      resolve();
      return;
    }

    const startTime = performance.now();

    const step = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      container.scrollTop = start + (distance * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(step);
  });
}

/**
 * Cubic ease-in-out easing curve
 */
export function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Animate element expansion using GSAP
 * Smooth scaling and growth animations
 */
export function animateExpansion(element, options = {}) {
  if (!element) return null;

  const {
    duration = 0.8,
    ease = "power2.out"
  } = options;

  // Get child elements
  const imageElement = element.querySelector('.item-image');
  const titleElement = element.querySelector('.item-title');
  const descriptionElement = element.querySelector('.item-description');
  const fullTextElement = element.querySelector('.item-full-text');
  const contentElement = element.querySelector('.item-content');
  const metaInlineElement = element.querySelector('.item-meta-inline');
  const metaUnderImageElement = element.querySelector('.item-meta-under-image');

  // Create timeline for coordinated animations
  const tl = gsap.timeline({
    onComplete: () => {
      console.log('[GSAP] Expansion animation complete');
      
      // Set final styles for compatibility with shrink animation
      element.style.paddingTop = '23px';
      element.style.paddingRight = '24px';
      element.style.paddingBottom = '35px';
      element.style.paddingLeft = '14px';
      element.style.maxHeight = '780px';
      element.style.marginTop = '28px';
      element.style.marginBottom = '28px';
      element.style.transform = 'translateY(-6px) scaleX(1) scaleY(1.06)';
      
      if (imageElement) {
        imageElement.style.width = '225px';
        imageElement.style.height = '225px';
      }
      
      if (titleElement) {
        titleElement.style.marginLeft = '-8px';
      }
    }
  });

  // Main container expansion
  tl.to(element, {
    paddingTop: '23px',
    paddingRight: '24px',
    paddingBottom: '35px',
    paddingLeft: '14px',
    maxHeight: '780px',
    marginTop: '28px',
    marginBottom: '28px',
    transform: 'translateY(-6px) scaleX(1) scaleY(1.06)',
    duration,
    ease,
    force3D: true
  }, 0);

  // Image growth
  if (imageElement) {
    tl.to(imageElement, {
      width: '225px',
      height: '225px',
      duration,
      ease,
      force3D: true
    }, 0);
  }

  // Full text fade-in (staggered)
  if (fullTextElement) {
    tl.fromTo(fullTextElement, 
      {
        opacity: 0,
        transform: 'translateY(10px)',
        maxHeight: '0',
        marginTop: '0'
      },
      {
        opacity: 1,
        transform: 'translateY(0)',
        maxHeight: 'calc(1.65em * 6)',
        marginTop: 'calc(1.6em * 0.6)',
        duration: duration * 0.7,
        ease,
        force3D: true
      },
      duration * 0.2
    );
  }

  // Metadata fade-in (after image)
  if (metaInlineElement) {
    tl.fromTo(metaInlineElement,
      {
        opacity: 0,
        transform: 'translateY(5px)'
      },
      {
        opacity: 1,
        transform: 'translateY(0)',
        duration: duration * 0.6,
        ease,
        force3D: true
      },
      duration * 0.8
    );
  }

  if (metaUnderImageElement) {
    tl.fromTo(metaUnderImageElement,
      {
        opacity: 0,
        transform: 'translateY(5px)'
      },
      {
        opacity: 1,
        transform: 'translateY(0)',
        duration: duration * 0.6,
        ease,
        force3D: true
      },
      duration * 0.8
    );
  }

  // Return animation-like object for compatibility
  return {
    onfinish: null,
    oncancel: null,
    cancel: () => tl.kill(),
    play: () => tl.play(),
    pause: () => tl.pause(),
    duration: duration * 1000, // Convert to ms for compatibility
    playState: 'running'
  };
}

/**
 * Animate element shrink using GSAP
 * Smooth scaling and shrink animations
 */
export function animateShrink(element, options = {}) {
  if (!element) {
    console.warn('[Animation] animateShrink called with null element');
    // Return a dummy animation object if element is null
    return {
      onfinish: null,
      oncancel: null,
      cancel: () => {},
      duration: 800,
      playState: 'finished'
    };
  }

  const {
    duration = 0.8,
    ease = "power2.inOut"
  } = options;

  // Get child elements
  const imageElement = element.querySelector('.item-image');
  const titleElement = element.querySelector('.item-title');
  const descriptionElement = element.querySelector('.item-description');
  const fullTextElement = element.querySelector('.item-full-text');
  const contentElement = element.querySelector('.item-content');
  const metaInlineElement = element.querySelector('.item-meta-inline');
  const metaUnderImageElement = element.querySelector('.item-meta-under-image');

  // Create timeline for coordinated animations
  const tl = gsap.timeline({
    onComplete: () => {
      console.log('[GSAP] Shrink animation complete');
      
      // Clean up inline styles after animation
      setTimeout(() => {
        element.style.paddingTop = '';
        element.style.paddingRight = '';
        element.style.paddingBottom = '';
        element.style.paddingLeft = '';
        element.style.maxHeight = '';
        element.style.marginTop = '';
        element.style.marginBottom = '';
        element.style.transform = '';
        
        if (imageElement) {
          imageElement.style.width = '';
          imageElement.style.height = '';
        }
        
        if (titleElement) {
          titleElement.style.marginLeft = '';
        }
        
        if (descriptionElement) {
          descriptionElement.style.opacity = '';
          descriptionElement.style.transform = '';
        }
        
        if (metaInlineElement) {
          metaInlineElement.style.opacity = '';
          metaInlineElement.style.transform = '';
        }
        
        if (metaUnderImageElement) {
          metaUnderImageElement.style.opacity = '';
          metaUnderImageElement.style.transform = '';
        }
      }, 50);
    }
  });

  // Main container shrink
  tl.to(element, {
    paddingTop: '24px',
    paddingRight: '24px',
    paddingBottom: '24px',
    paddingLeft: '24px',
    maxHeight: '420px',
    marginTop: '12px',
    marginBottom: '12px',
    transform: 'translateY(0) scaleX(1) scaleY(1)',
    duration,
    ease,
    force3D: true
  }, 0);

  // Image shrink
  if (imageElement) {
    tl.to(imageElement, {
      width: '112px',
      height: '112px',
      duration,
      ease,
      force3D: true
    }, 0);
  }

  // Title slide back
  if (titleElement) {
    tl.to(titleElement, {
      marginLeft: '0',
      duration,
      ease,
      force3D: true
    }, 0);
  }

  // Full text fade-out
  if (fullTextElement) {
    tl.to(fullTextElement, {
      opacity: 0,
      transform: 'translateY(10px)',
      maxHeight: '0',
      marginTop: '0',
      duration: duration * 0.6,
      ease,
      force3D: true
    }, 0);
  }

  // Metadata fade-out
  if (metaInlineElement) {
    tl.to(metaInlineElement, {
      opacity: 0,
      transform: 'translateY(5px)',
      duration: duration * 0.5,
      ease,
      force3D: true
    }, duration * 0.1);
  }

  if (metaUnderImageElement) {
    tl.to(metaUnderImageElement, {
      opacity: 0,
      transform: 'translateY(5px)',
      duration: duration * 0.5,
      ease,
      force3D: true
    }, duration * 0.1);
  }

  // Description fade back in
  if (descriptionElement) {
    // Ensure description is visible for animation
    descriptionElement.style.display = '-webkit-box';
    
    tl.fromTo(descriptionElement,
      {
        opacity: 0,
        transform: 'translateY(5px)'
      },
      {
        opacity: 0.85,
        transform: 'translateY(0)',
        duration: duration * 0.7,
        ease,
        force3D: true
      },
      duration * 0.1
    );
  }

  // Return animation-like object for compatibility
  return {
    onfinish: null,
    oncancel: null,
    cancel: () => tl.kill(),
    play: () => tl.play(),
    pause: () => tl.pause(),
    duration: duration * 1000, // Convert to ms for compatibility
    playState: 'running'
  };
}

