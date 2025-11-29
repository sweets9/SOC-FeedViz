import { useState, useEffect, useRef, useCallback } from 'react';
import { animateExpansion, animateShrink } from '../utils/animations';
import { scrollToElement, scrollToNext, createAutoScroll, cleanupScrollTriggers } from '../utils/gsapScroll';

const SPOTLIGHT_ANIMATION_DELAY = 300;
const SPOTLIGHT_DURATION = 6000;
const TRANSITION_DELAY = 400;
const DIMMING_DELAY = 150;
const SCROLL_DURATION = 600; // How long to wait for scroll to complete
const SMOOTH_SCROLL_DURATION = 2000; // Duration of smooth scroll animation

export function useSpotlight(items, containerRef) {
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isSpotlighting, setIsSpotlighting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoFocus, setAutoFocus] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [scrollSpeed, setScrollSpeed] = useState(6000); // milliseconds between articles
  const [continuousScroll, setContinuousScroll] = useState(true); // false = one at a time, true = continuous
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  const spotlightRunIdRef = useRef(0);
  const spotlightIndexRef = useRef(0); // Use ref to avoid closure issues
  const isPausedRef = useRef(false); // Use ref to avoid stale closure issues
  const autoFocusRef = useRef(false); // Use ref to avoid stale closure issues
  const autoScrollRef = useRef(true); // Use ref to avoid stale closure issues
  const scrollSpeedRef = useRef(6000); // Use ref to avoid stale closure issues
  const continuousScrollRef = useRef(true); // Use ref to avoid stale closure issues
  const scrollAnimationRef = useRef(null); // Track ongoing scroll animation
  const gsapAutoScrollRef = useRef(null); // Track GSAP auto-scroll controller
  const timersRef = useRef({
    dimming: null,
    spotlightApply: null,
    spotlight: null,
    nextSpotlight: null
  });
  const animationsRef = useRef({
    expand: null,
    shrink: null
  });
  
  // Keep refs in sync with state
  useEffect(() => {
    spotlightIndexRef.current = spotlightIndex;
  }, [spotlightIndex]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    autoFocusRef.current = autoFocus;
  }, [autoFocus]);

  useEffect(() => {
    continuousScrollRef.current = continuousScroll;
  }, [continuousScroll]);

  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  const clearTimers = useCallback(() => {
    Object.values(timersRef.current).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    timersRef.current = {
      dimming: null,
      spotlightApply: null,
      spotlight: null,
      nextSpotlight: null
    };

    if (animationsRef.current.expand) {
      animationsRef.current.expand.cancel();
      animationsRef.current.expand = null;
    }
    if (animationsRef.current.shrink) {
      animationsRef.current.shrink.cancel();
      animationsRef.current.shrink = null;
    }
    
    // Cancel any ongoing scroll animation
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
    
    // Stop GSAP auto-scroll
    if (gsapAutoScrollRef.current) {
      gsapAutoScrollRef.current.stop();
      gsapAutoScrollRef.current = null;
    }
    
    // Cleanup any ScrollTrigger instances
    cleanupScrollTriggers();
    
    // Reset auto-scrolling state
    setIsAutoScrolling(false);
  }, []);

  const resetSpotlightState = useCallback(({ resetIndex = false } = {}) => {
    clearTimers();
    setIsSpotlighting(false);
    if (resetIndex) {
      spotlightIndexRef.current = 0;
      setSpotlightIndex(0);
    }
  }, [clearTimers]);

  const spotlightNextItem = useCallback(() => {
    if (isPausedRef.current || !containerRef?.current) {
      console.log('[Spotlight] Paused or no container');
      return;
    }
    
    // Prevent multiple simultaneous scrolls
    if (scrollAnimationRef.current) {
      console.log('[Spotlight] Scroll already in progress, skipping');
      return;
    }

    // If auto-scroll is on but auto-focus is off, just scroll without spotlight
    if (autoScrollRef.current && !autoFocusRef.current) {
      const items = containerRef.current.querySelectorAll('.feed-item');
      if (items.length === 0) {
        console.log('[Spotlight] No items found');
        return;
      }

      const currentIndex = ((spotlightIndexRef.current % items.length) + items.length) % items.length;
      const nextIndex = (currentIndex + 1) % items.length;
      const nextItem = items[nextIndex];
      
      console.log(`[Spotlight] Auto-scrolling to item ${nextIndex + 1}/${items.length} (from ${currentIndex + 1}) - Mode: ${continuousScrollRef.current ? 'Continuous' : 'One-at-a-time'}`);
      console.log(`[Spotlight] Loop check: nextIndex=${nextIndex}, currentIndex=${currentIndex}, items.length=${items.length}`);
      
      // Calculate scroll duration based on mode
      const scrollDuration = continuousScrollRef.current 
        ? 1.0 // Slower continuous scroll to prevent double triggers
        : SMOOTH_SCROLL_DURATION / 1000; // Normal scroll with pause
      
      // Calculate pause time based on mode and scroll speed
      const pauseTime = continuousScrollRef.current 
        ? Math.max(1000, scrollSpeedRef.current / 2) // Continuous: half of scroll speed, min 1s
        : scrollSpeedRef.current; // One-at-a-time: full scroll speed
      
      console.log(`[Spotlight] Timing: scrollDuration=${scrollDuration}s, pauseTime=${pauseTime}ms, scrollSpeed=${scrollSpeedRef.current}ms (${continuousScrollRef.current ? 'Continuous' : 'One-at-a-time'} mode)`);
      
      // Set auto-scrolling state to active and mark scroll in progress
      setIsAutoScrolling(true);
      scrollAnimationRef.current = true;
      
      // If we're going back to the top, handle the loop
      if (nextIndex === 0 && currentIndex === items.length - 1) {
        console.log(`[Spotlight] *** LOOP DETECTED - Reached bottom, looping back to top (${continuousScrollRef.current ? 'Continuous' : 'One-at-a-time'} mode) ***`);
        // Update index to 0 to ensure we're at the top
        spotlightIndexRef.current = 0;
        setSpotlightIndex(0);
        // Scroll to top of container first
        container.scrollTop = 0;
        // Small delay before scrolling to first item
        setTimeout(() => {
          console.log(`[Spotlight] Starting scroll to first item after loop - pause will be ${pauseTime}ms`);
          scrollToElement(nextItem, container, {
            duration: scrollDuration,
            ease: 'power2.inOut',
            offset: 20,
            onStart: () => {
              console.log(`[GSAP] Auto-scroll started (loop to top - ${continuousScrollRef.current ? 'Continuous' : 'One-at-a-time'} mode)`);

              setIsAutoScrolling(true);
            },
            onComplete: () => {
              console.log('[GSAP] Auto-scroll completed (loop to top)');
              scrollAnimationRef.current = null; // Clear scroll flag
              if (!isPausedRef.current && autoScrollRef.current) {
                timersRef.current.spotlight = setTimeout(() => {
                  console.log('[Spotlight] Continuing to next item after loop pause');
                  spotlightNextItem();
                }, pauseTime);
              } else {
                console.log('[Spotlight] Auto-scroll stopped after loop (paused or disabled)');
                setIsAutoScrolling(false);
              }
            }
          });
        }, 500);
        return;
      }
      
      // Update index immediately for normal scroll
      spotlightIndexRef.current = nextIndex;
      setSpotlightIndex(nextIndex);
      
      // Stop any existing GSAP auto-scroll
      if (gsapAutoScrollRef.current) {
        gsapAutoScrollRef.current.stop();
        gsapAutoScrollRef.current = null;
      }
      
      // Use GSAP for smooth scrolling
      const container = containerRef.current;
      scrollToElement(nextItem, container, {
        duration: scrollDuration,
        ease: 'power2.inOut',
        offset: 20,
        onStart: () => {
          console.log(`[GSAP] Auto-scroll started (${continuousScrollRef.current ? 'Continuous' : 'One-at-a-time'} mode)`);
        },
        onComplete: () => {
          console.log(`[GSAP] Auto-scroll completed (${continuousScrollRef.current ? 'Continuous' : 'One-at-a-time'} mode)`);
          scrollAnimationRef.current = null; // Clear scroll flag
          // Animation complete
          if (!isPausedRef.current && autoScrollRef.current) {
            timersRef.current.spotlight = setTimeout(() => {
              spotlightNextItem();
            }, pauseTime);
          } else {
            // If paused or auto-scroll disabled, set state to false
            setIsAutoScrolling(false);
          }
        }
      });
      return;
    }

    // If auto-focus is required but off, don't proceed
    if (!autoFocusRef.current) {
      return;
    }

    const items = containerRef.current.querySelectorAll('.feed-item');
    if (items.length === 0) {
      console.log('[Spotlight] No items found');
      return;
    }

    // Use ref to get current index (avoids stale closure issues)
    const currentIndex = ((spotlightIndexRef.current % items.length) + items.length) % items.length;
    const currentItem = items[currentIndex];
    
    console.log(`[Spotlight] Starting spotlight for item ${currentIndex + 1}/${items.length}`);

    if (!currentItem) {
      spotlightIndexRef.current = 0;
      setSpotlightIndex(0);
      return;
    }

    const runId = ++spotlightRunIdRef.current;
    clearTimers();

    // Reset all items
    items.forEach(item => {
      item.classList.remove('spotlight', 'dimmed', 'push-up-1', 'push-up-2', 'push-up-3', 'push-down-1', 'push-down-2', 'push-down-3');
      item.style.transition = '';
      item.style.paddingTop = '';
      item.style.paddingRight = '';
      item.style.paddingBottom = '';
      item.style.paddingLeft = '';
      item.style.maxHeight = '';
      item.style.marginTop = '';
      item.style.marginBottom = '';
      item.style.transform = '';
    });

    // Scroll the item to the top of the container first (if auto-scroll is enabled)
    const scrollToItem = () => {
      if (!autoScrollRef.current) return Promise.resolve();
      
      const container = containerRef.current;
      console.log('[Spotlight] GSAP scrolling to spotlight item');
      
      return scrollToElement(currentItem, container, {
        duration: SMOOTH_SCROLL_DURATION / 1000, // Convert to seconds for GSAP
        ease: 'power2.inOut',
        offset: 20
      });
    };
    
    // Execute scroll and then spotlight
    if (autoScrollRef.current) {
      scrollToItem().then(() => {
        if (runId !== spotlightRunIdRef.current || isPausedRef.current) return;

        requestAnimationFrame(() => {
          if (runId !== spotlightRunIdRef.current || isPausedRef.current) return;

          // Dim other items
          timersRef.current.dimming = setTimeout(() => {
            if (runId !== spotlightRunIdRef.current || isPausedRef.current) return;
            requestAnimationFrame(() => {
              items.forEach(item => {
                if (item !== currentItem) {
                  item.classList.add('dimmed');
                }
              });
            });
          }, DIMMING_DELAY);

          // Apply spotlight with expansion animation
          timersRef.current.spotlightApply = setTimeout(() => {
            if (runId !== spotlightRunIdRef.current || isPausedRef.current) return;
            requestAnimationFrame(() => {
              // Apply staggered push animations
              items.forEach((item, index) => {
                if (item === currentItem) return;
                const distance = Math.abs(index - currentIndex);
                if (index < currentIndex) {
                  if (distance === 1) item.classList.add('push-up-1');
                  else if (distance === 2) item.classList.add('push-up-2');
                  else if (distance === 3) item.classList.add('push-up-3');
                } else {
                  if (distance === 1) item.classList.add('push-down-1');
                  else if (distance === 2) item.classList.add('push-down-2');
                  else if (distance === 3) item.classList.add('push-down-3');
                }
              });

              // Expand animation
              animationsRef.current.expand = animateExpansion(currentItem);
              currentItem.classList.add('spotlight');
              setIsSpotlighting(true);
            });
          }, SPOTLIGHT_ANIMATION_DELAY);

          // Shrink and move to next
          timersRef.current.spotlight = setTimeout(() => {
            if (runId !== spotlightRunIdRef.current || isPausedRef.current) return;

            requestAnimationFrame(() => {
              const shrinkAnim = animateShrink(currentItem);
              
              if (!shrinkAnim) {
                // If animation failed, proceed anyway
                currentItem.classList.remove('spotlight');
                items.forEach(item => {
                  item.classList.remove('dimmed', 'push-up-1', 'push-up-2', 'push-up-3', 'push-down-1', 'push-down-2', 'push-down-3');
                });
                setIsSpotlighting(false);
                const nextIndex = (currentIndex + 1) % items.length;
                spotlightIndexRef.current = nextIndex;
                setSpotlightIndex(nextIndex);
                
                timersRef.current.nextSpotlight = setTimeout(() => {
                  if (runId !== spotlightRunIdRef.current || isPausedRef.current) return;
                  requestAnimationFrame(() => {
                    spotlightNextItem();
                  });
                }, TRANSITION_DELAY);
                return;
              }
              
              // Store animation reference
              animationsRef.current.shrink = shrinkAnim;
              
              // Set onfinish handler immediately after getting animation
              // Use a flag to prevent multiple calls
              let handlerCalled = false;
              
              const finishHandler = () => {
                if (handlerCalled) {
                  console.log('[Spotlight] Handler already called, ignoring duplicate');
                  return;
                }
                handlerCalled = true;
                
                console.log('[Spotlight] Shrink onfinish handler called');
                
                // Check if we should proceed (use ref for current value)
                if (isPausedRef.current) {
                  console.log('[Spotlight] Aborting - paused');
                  animationsRef.current.shrink = null;
                  return;
                }

                // Get fresh items and calculate next index
                const freshItems = containerRef.current?.querySelectorAll('.feed-item');
                if (!freshItems || freshItems.length === 0) {
                  console.log('[Spotlight] No items found, aborting');
                  animationsRef.current.shrink = null;
                  return;
                }

                // Clean up current spotlight
                currentItem.classList.remove('spotlight');
                freshItems.forEach(item => {
                  item.classList.remove('dimmed', 'push-up-1', 'push-up-2', 'push-up-3', 'push-down-1', 'push-down-2', 'push-down-3');
                });
                setIsSpotlighting(false);
                animationsRef.current.shrink = null;
                
                // Move to next item
                const nextIndex = (currentIndex + 1) % freshItems.length;
                spotlightIndexRef.current = nextIndex;
                setSpotlightIndex(nextIndex);
                
                console.log(`[Spotlight] Triggering next spotlight cycle`);
                requestAnimationFrame(() => {
                  spotlightNextItem();
                });
              };

              shrinkAnim.onfinish = () => {
                console.log('[Spotlight] Animation finished');
                finishHandler();
              };
              
              shrinkAnim.oncancel = () => {
                animationsRef.current.shrink = null;
              };
            });
          }, scrollSpeedRef.current);
        });
      });
    } else {
      // If auto-scroll is off, spotlight immediately
      requestAnimationFrame(() => {
        if (runId !== spotlightRunIdRef.current || isPausedRef.current) return;

        // Dim other items
        timersRef.current.dimming = setTimeout(() => {
          if (runId !== spotlightRunIdRef.current || isPausedRef.current) return;
          requestAnimationFrame(() => {
            items.forEach(item => {
              if (item !== currentItem) {
                item.classList.add('dimmed');
              }
            });
          });
        }, DIMMING_DELAY);

        // Apply spotlight animation
        timersRef.current.spotlightApply = setTimeout(() => {
          if (runId !== spotlightRunIdRef.current || isPausedRef.current) return;
          requestAnimationFrame(() => {
            // Expand animation
            animationsRef.current.expand = animateExpansion(currentItem);
            currentItem.classList.add('spotlight');
            setIsSpotlighting(true);
          });
        }, SPOTLIGHT_ANIMATION_DELAY);

        // Shrink and move to next
        timersRef.current.spotlight = setTimeout(() => {
          if (runId !== spotlightRunIdRef.current || isPausedRef.current) return;

          requestAnimationFrame(() => {
            const shrinkAnim = animateShrink(currentItem);
            
            if (!shrinkAnim) {
              // If animation failed, proceed anyway
              currentItem.classList.remove('spotlight');
              items.forEach(item => {
                item.classList.remove('dimmed', 'push-up-1', 'push-up-2', 'push-up-3', 'push-down-1', 'push-down-2', 'push-down-3');
              });
              setIsSpotlighting(false);
              const nextIndex = (currentIndex + 1) % items.length;
              spotlightIndexRef.current = nextIndex;
              setSpotlightIndex(nextIndex);
              
              timersRef.current.nextSpotlight = setTimeout(() => {
                if (runId !== spotlightRunIdRef.current || isPausedRef.current) return;
                requestAnimationFrame(() => {
                  spotlightNextItem();
                });
              }, TRANSITION_DELAY);
              return;
            }
            
            // Store animation reference
            animationsRef.current.shrink = shrinkAnim;
            
            // Set onfinish handler immediately after getting animation
            // Use a flag to prevent multiple calls
            let handlerCalled = false;
            
            const finishHandler = () => {
              if (handlerCalled) {
                console.log('[Spotlight] Handler already called, ignoring duplicate');
                return;
              }
              handlerCalled = true;
              
              console.log('[Spotlight] Shrink onfinish handler called');
              
              // Check if we should proceed (use ref for current value)
              if (isPausedRef.current) {
                console.log('[Spotlight] Aborting - paused');
                animationsRef.current.shrink = null;
                return;
              }

              // Get fresh items and calculate next index
              const freshItems = containerRef.current?.querySelectorAll('.feed-item');
              if (!freshItems || freshItems.length === 0) {
                console.log('[Spotlight] No items found, aborting');
                animationsRef.current.shrink = null;
                return;
              }

              // Clean up current spotlight
              currentItem.classList.remove('spotlight');
              freshItems.forEach(item => {
                item.classList.remove('dimmed', 'push-up-1', 'push-up-2', 'push-up-3', 'push-down-1', 'push-down-2', 'push-down-3');
              });
              setIsSpotlighting(false);
              animationsRef.current.shrink = null;
              
              // Move to next item
              const nextIndex = (currentIndex + 1) % freshItems.length;
              spotlightIndexRef.current = nextIndex;
              setSpotlightIndex(nextIndex);
              
              console.log(`[Spotlight] Triggering next spotlight cycle`);
              requestAnimationFrame(() => {
                spotlightNextItem();
              });
            };

            shrinkAnim.onfinish = () => {
              console.log('[Spotlight] Animation finished');
              finishHandler();
            };
            
            shrinkAnim.oncancel = () => {
              animationsRef.current.shrink = null;
            };
          });
        }, scrollSpeedRef.current);
      });
    }
  }, [containerRef, clearTimers]); // Using refs for isPaused and spotlightIndex to avoid stale closures

  const pauseSpotlight = useCallback(() => {
    clearTimers();
    setIsPaused(true);
    setIsAutoScrolling(false);
  }, [clearTimers]);

  const resumeSpotlight = useCallback(() => {
    setIsPaused(false);
    if (items.length > 0) {
      requestAnimationFrame(() => {
        spotlightNextItem();
      });
    }
  }, [items.length, spotlightNextItem]);

  const navigateToItem = useCallback((direction) => {
    if (!containerRef?.current) return;
    
    const items = containerRef.current.querySelectorAll('.feed-item');
    if (items.length === 0) return;
    
    const currentIndex = ((spotlightIndexRef.current % items.length) + items.length) % items.length;
    const currentItem = items[currentIndex];
    
    // If there's a current spotlight item, shrink it first
    if (currentItem && currentItem.classList.contains('spotlight')) {
      const shrinkAnim = animateShrink(currentItem);
      if (shrinkAnim) {
        animationsRef.current.shrink = shrinkAnim;
        shrinkAnim.onfinish = () => {
          // Clean up current spotlight
          currentItem.classList.remove('spotlight');
          items.forEach(item => {
            item.classList.remove('dimmed', 'push-up-1', 'push-up-2', 'push-up-3', 'push-down-1', 'push-down-2', 'push-down-3');
          });
          setIsSpotlighting(false);
          animationsRef.current.shrink = null;
          
          // Now navigate to next/prev
          clearTimers();
          setIsPaused(false);
          
          if (direction === 'next') {
            const nextIdx = (spotlightIndexRef.current + 1) % items.length;
            spotlightIndexRef.current = nextIdx;
            setSpotlightIndex(nextIdx);
          } else {
            const prevIdx = (spotlightIndexRef.current - 1 + items.length) % items.length;
            spotlightIndexRef.current = prevIdx;
            setSpotlightIndex(prevIdx);
          }
          
          requestAnimationFrame(() => {
            spotlightNextItem();
          });
        };
      } else {
        // If animation failed, proceed anyway
        currentItem.classList.remove('spotlight');
        items.forEach(item => {
          item.classList.remove('dimmed', 'push-up-1', 'push-up-2', 'push-up-3', 'push-down-1', 'push-down-2', 'push-down-3');
        });
        setIsSpotlighting(false);
        clearTimers();
        setIsPaused(false);
        
        if (direction === 'next') {
          const nextIdx = (spotlightIndexRef.current + 1) % items.length;
          spotlightIndexRef.current = nextIdx;
          setSpotlightIndex(nextIdx);
        } else {
          const prevIdx = (spotlightIndexRef.current - 1 + items.length) % items.length;
          spotlightIndexRef.current = prevIdx;
          setSpotlightIndex(prevIdx);
        }
        
        requestAnimationFrame(() => {
          spotlightNextItem();
        });
      }
    } else {
      // No current spotlight, just navigate
      clearTimers();
      setIsPaused(false);
      
      if (direction === 'next') {
        const nextIdx = (spotlightIndexRef.current + 1) % items.length;
        spotlightIndexRef.current = nextIdx;
        setSpotlightIndex(nextIdx);
      } else {
        const prevIdx = (spotlightIndexRef.current - 1 + items.length) % items.length;
        spotlightIndexRef.current = prevIdx;
        setSpotlightIndex(prevIdx);
      }
      
      requestAnimationFrame(() => {
        spotlightNextItem();
      });
    }
  }, [clearTimers, spotlightNextItem]);

  // Auto-start spotlight when items are available
  useEffect(() => {
    if (items.length > 0 && !isPaused && (autoFocus || autoScroll)) {
      const timer = setTimeout(() => {
        spotlightNextItem();
      }, 1000); // Start after 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [items.length, isPaused, autoFocus, autoScroll, spotlightNextItem]);

  // Handle autoScroll toggle changes
  useEffect(() => {
    console.log(`[AutoScroll Debug] autoScroll: ${autoScroll}, isPaused: ${isPaused}, items.length: ${items.length}, isAutoScrolling: ${isAutoScrolling}`);
    
    if (autoScroll && !isPaused && items.length > 0 && !isAutoScrolling) {
      // Start auto-scroll if it was turned on
      console.log('[AutoScroll Debug] Starting auto-scroll...');
      const timer = setTimeout(() => {
        spotlightNextItem();
      }, 500);
      return () => clearTimeout(timer);
    } else if (!autoScroll && isAutoScrolling) {
      // Stop auto-scroll if it was turned off
      console.log('[AutoScroll Debug] Stopping auto-scroll...');
      clearTimers();
    }
  }, [autoScroll, isPaused, items.length, isAutoScrolling, spotlightNextItem, clearTimers]);

  return {
    spotlightIndex,
    isSpotlighting,
    isPaused,
    autoFocus,
    autoScroll,
    scrollSpeed,
    continuousScroll,
    isAutoScrolling,
    setAutoFocus,
    setAutoScroll,
    setScrollSpeed,
    setContinuousScroll,
    pauseSpotlight,
    resumeSpotlight,
    navigateToItem,
    resetSpotlightState
  };
}
