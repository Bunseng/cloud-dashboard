'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. A small "pulse" scale. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type CalendarProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: { scale: 1 },
      animate: { scale: [1, 0.9, 1], transition: { duration: 0.4, ease: 'easeInOut' } },
    },
    path: {},
    rect: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: CalendarProps) {
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
        <motion.path d="M8 2v3" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M16 2v3" variants={variants.path} initial="initial" animate={controls} />
        <motion.rect x="3" y="3" width="18" height="18" rx="2" variants={variants.rect} initial="initial" animate={controls} />
        <motion.path d="M3 9h18" variants={variants.path} initial="initial" animate={controls} />
      </motion.g>
    </motion.svg>
  );
}

function Calendar(props: CalendarProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Calendar,
  Calendar as CalendarIcon,
  type CalendarProps,
  type CalendarProps as CalendarIconProps,
};
