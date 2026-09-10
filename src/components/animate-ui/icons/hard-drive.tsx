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

type HardDriveProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: { scale: 1 },
      animate: { scale: [1, 0.9, 1], transition: { duration: 0.5, ease: 'easeInOut' } },
    },
    path: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: HardDriveProps) {
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
        <motion.path d="M10 16h.01" variants={variants.path} initial="initial" animate={controls} />
        <motion.path
          d="M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
          variants={variants.path}
          initial="initial"
          animate={controls}
        />
        <motion.path d="M21.946 12.013H2.054" variants={variants.path} initial="initial" animate={controls} />
        <motion.path d="M6 16h.01" variants={variants.path} initial="initial" animate={controls} />
      </motion.g>
    </motion.svg>
  );
}

function HardDrive(props: HardDriveProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  HardDrive,
  HardDrive as HardDriveIcon,
  type HardDriveProps,
  type HardDriveProps as HardDriveIconProps,
};
