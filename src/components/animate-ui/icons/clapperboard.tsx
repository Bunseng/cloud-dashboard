'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. The clapper top snaps shut. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type ClapperboardProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    top: {
      initial: { rotate: 0, transition: { duration: 0.25, ease: 'easeInOut' } },
      animate: { rotate: -6, transition: { duration: 0.25, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
    path4: {},
  } satisfies Record<string, Variants>,
  'default-loop': {
    top: {
      initial: { rotate: 0 },
      animate: { rotate: [0, -6, 0], transition: { duration: 0.5, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
    path4: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ClapperboardProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <motion.g
        variants={variants.top}
        initial="initial"
        animate={controls}
        style={{ originX: '0.15', originY: '0.5' }}
      >
        <motion.path
          d="m12.296 3.464 3.02 3.956"
          variants={variants.path1}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z"
          variants={variants.path2}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="m6.18 5.276 3.1 3.899"
          variants={variants.path4}
          initial="initial"
          animate={controls}
        />
      </motion.g>
      <motion.path
        d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Clapperboard(props: ClapperboardProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Clapperboard,
  Clapperboard as ClapperboardIcon,
  type ClapperboardProps,
  type ClapperboardProps as ClapperboardIconProps,
};
