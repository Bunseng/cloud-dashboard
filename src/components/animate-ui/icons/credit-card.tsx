'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. The magnetic stripe "swipes" in. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type CreditCardProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    rect: {},
    line: {
      initial: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: { duration: 0.35, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    rect: {},
    line: {
      initial: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [1, 0, 1],
        opacity: [1, 0, 1],
        transition: { duration: 0.7, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: CreditCardProps) {
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
        height={14}
        x={2}
        y={5}
        rx={2}
        variants={variants.rect}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1={2}
        x2={22}
        y1={10}
        y2={10}
        variants={variants.line}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function CreditCard(props: CreditCardProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  CreditCard,
  CreditCard as CreditCardIcon,
  type CreditCardProps,
  type CreditCardProps as CreditCardIconProps,
};
