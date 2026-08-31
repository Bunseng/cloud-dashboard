'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type SaveProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: { scale: 1, transition: { duration: 0.25, ease: 'easeInOut' } },
      animate: { scale: 0.92, transition: { duration: 0.25, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
  } satisfies Record<string, Variants>,
  'default-loop': {
    group: {
      initial: { scale: 1 },
      animate: { scale: [1, 0.92, 1], transition: { duration: 0.5, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    path3: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: SaveProps) {
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
        <motion.path
          d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
          variants={variants.path1}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"
          variants={variants.path2}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="M7 3v4a1 1 0 0 0 1 1h7"
          variants={variants.path3}
          initial="initial"
          animate={controls}
        />
      </motion.g>
    </motion.svg>
  );
}

function Save(props: SaveProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Save,
  Save as SaveIcon,
  type SaveProps,
  type SaveProps as SaveIconProps,
};
