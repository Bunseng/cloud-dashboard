'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. A little "writing" wiggle. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type PencilProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: { rotate: 0, transition: { duration: 0.15, ease: 'easeInOut' } },
      animate: { rotate: -12, transition: { duration: 0.15, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
  } satisfies Record<string, Variants>,
  'default-loop': {
    group: {
      initial: { rotate: 0 },
      animate: { rotate: [0, -12, 12, 0], transition: { duration: 0.5, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: PencilProps) {
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
        style={{ originX: '0.1', originY: '0.9' }}
      >
        <motion.path
          d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
          variants={variants.path1}
          initial="initial"
          animate={controls}
        />
        <motion.path
          d="m15 5 4 4"
          variants={variants.path2}
          initial="initial"
          animate={controls}
        />
      </motion.g>
    </motion.svg>
  );
}

function Pencil(props: PencilProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Pencil,
  Pencil as PencilIcon,
  type PencilProps,
  type PencilProps as PencilIconProps,
};
