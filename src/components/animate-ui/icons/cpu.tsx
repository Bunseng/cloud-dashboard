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

type CpuProps = IconProps<keyof typeof animations>;

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

function IconComponent({ size, ...props }: CpuProps) {
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
        <motion.path d="M12 20v2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M12 2v2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M17 20v2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M17 2v2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M2 12h2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M2 17h2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M2 7h2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M20 12h2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M20 17h2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M20 7h2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M7 20v2" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M7 2v2" variants={variants.path} initial="initial" animate={controls} />
        <motion.rect x="4" y="4" width="16" height="16" rx="2" variants={variants.rect} initial="initial" animate={controls} />
        <motion.rect x="8" y="8" width="8" height="8" rx="1" variants={variants.rect} initial="initial" animate={controls} />
      </motion.g>
    </motion.svg>
  );
}

function Cpu(props: CpuProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Cpu,
  Cpu as CpuIcon,
  type CpuProps,
  type CpuProps as CpuIconProps,
};
