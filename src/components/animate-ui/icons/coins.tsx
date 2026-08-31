'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. A little "jingle" wobble. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type CoinsProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: { rotate: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { rotate: -8, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
    circle: {},
  } satisfies Record<string, Variants>,
  'default-loop': {
    group: {
      initial: { rotate: 0 },
      animate: { rotate: [0, -8, 8, 0], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
    circle: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: CoinsProps) {
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
        style={{ originX: '0.35', originY: '0.65' }}
      >
        <motion.path
          d="M13.744 17.736a6 6 0 1 1-7.48-7.48"
          variants={variants.path1}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M15 6h1v4"
          variants={variants.path2}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="m6.134 14.768.866-.5 2 3.464"
          variants={variants.path3}
          initial="initial"
          animate={controls}
        />
        <motion.circle
          cx={16}
          cy={8}
          r={6}
          variants={variants.circle}
          initial="initial"
          animate={controls}
        />
      </motion.g>
    </motion.svg>
  );
}

function Coins(props: CoinsProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Coins,
  Coins as CoinsIcon,
  type CoinsProps,
  type CoinsProps as CoinsIconProps,
};
