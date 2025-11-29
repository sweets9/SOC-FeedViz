/**
 * Animation utilities using Framer Motion for smooth transitions
 */

import { motion, AnimatePresence } from 'framer-motion';

// Framer Motion animation variants for spotlight expansion
export const spotlightVariants = {
  normal: {
    scale: 1,
    paddingTop: '24px',
    paddingRight: '24px',
    paddingBottom: '24px',
    paddingLeft: '24px',
    maxHeight: '420px',
    marginTop: '12px',
    marginBottom: '12px',
    transform: 'translateY(0) scaleX(1) scaleY(1)',
    transition: {
      duration: 0.8,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  spotlight: {
    scale: 1.06,
    paddingTop: '23px',
    paddingRight: '24px',
    paddingBottom: '35px',
    paddingLeft: '14px',
    maxHeight: '780px',
    marginTop: '28px',
    marginBottom: '28px',
    transform: 'translateY(-6px) scaleX(1) scaleY(1.06)',
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Image animation variants
export const imageVariants = {
  normal: {
    width: '112px',
    height: '112px',
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  spotlight: {
    width: '225px',
    height: '225px',
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Title animation variants
export const titleVariants = {
  normal: {
    marginLeft: '0',
    transition: {
      duration: 0.8,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  spotlight: {
    marginLeft: '-8px',
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Full text animation variants
export const fullTextVariants = {
  normal: {
    opacity: 0,
    transform: 'translateY(10px)',
    maxHeight: '0',
    marginTop: '0',
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  spotlight: {
    opacity: 1,
    transform: 'translateY(0)',
    maxHeight: 'calc(1.65em * 6)',
    marginTop: 'calc(1.6em * 0.6)',
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 0.2
    }
  }
};

// Metadata animation variants
export const metadataVariants = {
  normal: {
    opacity: 0.85,
    transform: 'translateY(0)',
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  spotlight: {
    opacity: 0,
    transform: 'translateY(5px)',
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Description animation variants  
export const descriptionVariants = {
  normal: {
    opacity: 0.85,
    transform: 'translateY(0)',
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 0.1
    }
  },
  spotlight: {
    opacity: 0,
    transform: 'translateY(5px)',
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Stagger animation for surrounding items
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  animate: {
    y: [0, -4, 0],
    opacity: [1, 0.3, 1],
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Export motion components for easy use
export const MotionFeedItem = motion.div;
export const MotionImage = motion.img;
export const MotionTitle = motion.h3;
export const MotionDescription = motion.p;
export const MotionFullText = motion.div;
export const MotionMetadata = motion.div;

// Animation presets
export const animationPresets = {
  expand: {
    initial: 'normal',
    animate: 'spotlight',
    exit: 'normal'
  },
  shrink: {
    initial: 'spotlight', 
    animate: 'normal',
    exit: 'normal'
  },
  stagger: {
    initial: 'normal',
    animate: 'animate',
    exit: 'normal'
  }
};
