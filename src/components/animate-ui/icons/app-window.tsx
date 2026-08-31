'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. The title bar "slides open". */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type AppWindowProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    rect: {},
    path1: {
      initial: { y: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { y: 1.5, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
    path2: {},
    path3: {
      initial: { y: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { y: 1.5, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    rect: {},
    path1: {
      initial: { y: 0 },
      animate: { y: [0, 1.5, 0], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
    path2: {},
    path3: {
      initial: { y: 0 },
      animate: { y: [0, 1.5, 0], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: AppWindowProps) {
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
        x={2}
        y={4}
        width={20}
        height={16}
        rx={2}
        variants={variants.rect}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M10 4v4"
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M2 8h20"
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M6 4v4"
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function AppWindow(props: AppWindowProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  AppWindow,
  AppWindow as AppWindowIcon,
  type AppWindowProps,
  type AppWindowProps as AppWindowIconProps,
};
