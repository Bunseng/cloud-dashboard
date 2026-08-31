'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. A small "listening" pulse. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type HeadphonesProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {
      initial: { scale: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { scale: 1.08, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path1: {
      initial: { scale: 1 },
      animate: { scale: [1, 1.08, 1], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: HeadphonesProps) {
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
      <motion.path
        d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"
        variants={variants.path1}
        initial="initial"
        animate={controls}
        style={{ originX: '0.5', originY: '0.5' }}
      />
    </motion.svg>
  );
}

function Headphones(props: HeadphonesProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Headphones,
  Headphones as HeadphonesIcon,
  type HeadphonesProps,
  type HeadphonesProps as HeadphonesIconProps,
};
