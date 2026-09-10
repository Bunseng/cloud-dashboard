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

type NetworkProps = IconProps<keyof typeof animations>;

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

function IconComponent({ size, ...props }: NetworkProps) {
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
        <motion.rect x="16" y="16" width="6" height="6" rx="1" variants={variants.rect} initial="initial" animate={controls} />
        <motion.rect x="2" y="16" width="6" height="6" rx="1" variants={variants.rect} initial="initial" animate={controls} />
        <motion.rect x="9" y="2" width="6" height="6" rx="1" variants={variants.rect} initial="initial" animate={controls} />
        <motion.path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M12 12V8" variants={variants.path} initial="initial" animate={controls} />
      </motion.g>
    </motion.svg>
  );
}

function Network(props: NetworkProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Network,
  Network as NetworkIcon,
  type NetworkProps,
  type NetworkProps as NetworkIconProps,
};
