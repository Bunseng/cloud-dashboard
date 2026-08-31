'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. The status lights blink. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type ServerProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    rect1: {},
    rect2: {},
    line1: {
      initial: { opacity: 1, transition: { duration: 0.2, ease: 'easeInOut' } },
      animate: { opacity: 0.25, transition: { duration: 0.2, ease: 'easeInOut' } },
    },
    line2: {
      initial: { opacity: 1, transition: { duration: 0.2, ease: 'easeInOut', delay: 0.15 } },
      animate: { opacity: 0.25, transition: { duration: 0.2, ease: 'easeInOut', delay: 0.15 } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    rect1: {},
    rect2: {},
    line1: {
      initial: { opacity: 1 },
      animate: {
        opacity: [1, 0.25, 1],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    line2: {
      initial: { opacity: 1 },
      animate: {
        opacity: [1, 0.25, 1],
        transition: { duration: 0.6, ease: 'easeInOut', delay: 0.15 },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ServerProps) {
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
      <motion.rect
        width={20}
        height={8}
        x={2}
        y={2}
        rx={2}
        ry={2}
        variants={variants.rect1}
        initial="initial"
        animate={controls}
      />
      <motion.rect
        width={20}
        height={8}
        x={2}
        y={14}
        rx={2}
        ry={2}
        variants={variants.rect2}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1={6}
        x2={6.01}
        y1={6}
        y2={6}
        variants={variants.line1}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1={6}
        x2={6.01}
        y1={18}
        y2={18}
        variants={variants.line2}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Server(props: ServerProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Server,
  Server as ServerIcon,
  type ServerProps,
  type ServerProps as ServerIconProps,
};
