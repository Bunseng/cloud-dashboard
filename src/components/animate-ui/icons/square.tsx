'use client';

/* Not published in the official animate-ui registry (only square-arrow-*,
   square-plus, square-x, square-kanban — no plain square) — hand-authored
   to match the same convention as the generated icons in this folder,
   using lucide-react's exact path data. Used as a "stop" glyph. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type SquareProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    rect: {
      initial: { scale: 1, transition: { duration: 0.25, ease: 'easeInOut' } },
      animate: { scale: 0.85, transition: { duration: 0.25, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    rect: {
      initial: { scale: 1 },
      animate: { scale: [1, 0.85, 1], transition: { duration: 0.5, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: SquareProps) {
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
        width={18}
        height={18}
        x={3}
        y={3}
        rx={2}
        variants={variants.rect}
        initial="initial"
        animate={controls}
        style={{ originX: '0.5', originY: '0.5' }}
      />
    </motion.svg>
  );
}

function Square(props: SquareProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Square,
  Square as SquareIcon,
  type SquareProps,
  type SquareProps as SquareIconProps,
};
