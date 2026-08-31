'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. A subtle "sparkle" scale. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type GemProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: { scale: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { scale: 1.1, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
  } satisfies Record<string, Variants>,
  'default-loop': {
    group: {
      initial: { scale: 1 },
      animate: { scale: [1, 1.1, 1], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: GemProps) {
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
          d="M10.5 3 8 9l4 13 4-13-2.5-6"
          variants={variants.path1}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"
          variants={variants.path2}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M2 9h20"
          variants={variants.path3}
          initial="initial"
          animate={controls}
        />
      </motion.g>
    </motion.svg>
  );
}

function Gem(props: GemProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Gem,
  Gem as GemIcon,
  type GemProps,
  type GemProps as GemIconProps,
};
