'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. Dots pulse in sequence on trigger. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type EllipsisProps = IconProps<keyof typeof animations>;

const DOT_TRANSITION = { duration: 0.3, ease: 'easeInOut' } as const;

const animations = {
  default: {
    group: {},
    circle1: {
      initial: { scale: 1 },
      animate: { scale: [1, 1.4, 1], transition: { ...DOT_TRANSITION, delay: 0 } },
    },
    circle2: {
      initial: { scale: 1 },
      animate: { scale: [1, 1.4, 1], transition: { ...DOT_TRANSITION, delay: 0.1 } },
    },
    circle3: {
      initial: { scale: 1 },
      animate: { scale: [1, 1.4, 1], transition: { ...DOT_TRANSITION, delay: 0.2 } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: EllipsisProps) {
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
      <motion.g variants={variants.group} initial="initial" animate={controls}>
        <motion.circle cx="12" cy="12" r="1" fill="currentColor" variants={variants.circle1} initial="initial" animate={controls} />
        <motion.circle cx="19" cy="12" r="1" fill="currentColor" variants={variants.circle2} initial="initial" animate={controls} />
        <motion.circle cx="5" cy="12" r="1" fill="currentColor" variants={variants.circle3} initial="initial" animate={controls} />
      </motion.g>
    </motion.svg>
  );
}

function Ellipsis(props: EllipsisProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Ellipsis,
  Ellipsis as EllipsisIcon,
  type EllipsisProps,
  type EllipsisProps as EllipsisIconProps,
};
