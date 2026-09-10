'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. The bow gives a little turn. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type KeyProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {},
    path2: {},
    circle: {
      initial: { rotate: 0 },
      animate: { rotate: [0, -15, 0], transition: { duration: 0.4, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: KeyProps) {
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
        d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path d="m21 2-9.6 9.6" variants={variants.path2} initial="initial" animate={controls} />
      <motion.circle
        cx="7.5"
        cy="15.5"
        r="5.5"
        variants={variants.circle}
        initial="initial"
        animate={controls}
        style={{ originX: '0.5', originY: '0.5' }}
      />
    </motion.svg>
  );
}

function Key(props: KeyProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Key,
  Key as KeyIcon,
  type KeyProps,
  type KeyProps as KeyIconProps,
};
