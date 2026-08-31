'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. Only the play button pulses. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type ImagePlayProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    play: {
      initial: { scale: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { scale: 1.15, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    circle: {},
  } satisfies Record<string, Variants>,
  'default-loop': {
    play: {
      initial: { scale: 1 },
      animate: { scale: [1, 1.15, 1], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
    path1: {},
    path2: {},
    circle: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ImagePlayProps) {
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
      <motion.path
        d="M15 15.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997a1 1 0 0 1-1.517-.86z"
        variants={variants.play}
        initial="initial"
        animate={controls}
        style={{ originX: '0.68', originY: '0.75' }}
      />
      <motion.path
        d="M21 12.17V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="m6 21 5-5"
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.circle
        cx={9}
        cy={9}
        r={2}
        variants={variants.circle}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function ImagePlay(props: ImagePlayProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  ImagePlay,
  ImagePlay as ImagePlayIcon,
  type ImagePlayProps,
  type ImagePlayProps as ImagePlayIconProps,
};
