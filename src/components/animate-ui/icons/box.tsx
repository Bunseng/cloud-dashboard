'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. A small "package pop". */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type BoxProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: { scale: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { scale: 1.08, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
  } satisfies Record<string, Variants>,
  'default-loop': {
    group: {
      initial: { scale: 1 },
      animate: { scale: [1, 1.08, 1], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: BoxProps) {
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
        variants={variants.group}
        initial="initial"
        animate={controls}
        style={{ originX: '0.5', originY: '0.5' }}
      >
        <motion.path
          d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
          variants={variants.path1}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="m3.3 7 8.7 5 8.7-5"
          variants={variants.path2}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M12 22V12"
          variants={variants.path3}
          initial="initial"
          animate={controls}
        />
      </motion.g>
    </motion.svg>
  );
}

function Box(props: BoxProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Box,
  Box as BoxIcon,
  type BoxProps,
  type BoxProps as BoxIconProps,
};
