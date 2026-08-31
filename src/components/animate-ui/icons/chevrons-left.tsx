'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as chevron-left.tsx, using lucide-react's
   exact path data for the double-chevron "first page" glyph. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type ChevronsLeftProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {
      initial: { x: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { x: -4, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
    path2: {
      initial: { x: 0, transition: { duration: 0.3, ease: 'easeInOut', delay: 0.05 } },
      animate: { x: -4, transition: { duration: 0.3, ease: 'easeInOut', delay: 0.05 } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path1: {
      initial: { x: 0 },
      animate: { x: [0, -4, 0], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
    path2: {
      initial: { x: 0 },
      animate: {
        x: [0, -4, 0],
        transition: { duration: 0.6, ease: 'easeInOut', delay: 0.05 },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ChevronsLeftProps) {
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
        d="m11 17-5-5 5-5"
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="m18 17-5-5 5-5"
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function ChevronsLeft(props: ChevronsLeftProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  ChevronsLeft,
  ChevronsLeft as ChevronsLeftIcon,
  type ChevronsLeftProps,
  type ChevronsLeftProps as ChevronsLeftIconProps,
};
