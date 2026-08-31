'use client';

/* Not published in the official animate-ui registry (only circle-check,
   circle-plus, circle-x — no plain circle) — hand-authored to match the
   same convention as the generated icons in this folder. Used as the
   radio-button dot, so it draws itself in on select. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type CircleProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    circle: {
      initial: { scale: 1, transition: { duration: 0.25, ease: 'easeInOut' } },
      animate: { scale: 0.55, transition: { duration: 0.25, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    circle: {
      initial: { scale: 1 },
      animate: { scale: [1, 0.55, 1], transition: { duration: 0.5, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: CircleProps) {
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
      <motion.circle
        cx={12}
        cy={12}
        r={10}
        variants={variants.circle}
        initial="initial"
        animate={controls}
        style={{ originX: '0.5', originY: '0.5' }}
      />
    </motion.svg>
  );
}

function Circle(props: CircleProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Circle,
  Circle as CircleIcon,
  type CircleProps,
  type CircleProps as CircleIconProps,
};
