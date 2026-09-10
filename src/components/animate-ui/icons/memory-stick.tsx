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

type MemoryStickProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: { scale: 1 },
      animate: { scale: [1, 0.9, 1], transition: { duration: 0.5, ease: 'easeInOut' } },
    },
    path: {},
    rect: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: MemoryStickProps) {
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
        <motion.path d="M12 12v-2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M12 18v-2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M16 12v-2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M16 18v-2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M2 11h1.5" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M20 18v-2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M20.5 11H22" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M4 18v-2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M8 12v-2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M8 18v-2" variants={variants.path} initial="initial" animate={controls} />
        <motion.rect x="2" y="6" width="20" height="10" rx="2" variants={variants.rect} initial="initial" animate={controls} />
      </motion.g>
    </motion.svg>
  );
}

function MemoryStick(props: MemoryStickProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  MemoryStick,
  MemoryStick as MemoryStickIcon,
  type MemoryStickProps,
  type MemoryStickProps as MemoryStickIconProps,
};
