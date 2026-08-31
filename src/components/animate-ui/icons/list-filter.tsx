'use client';

/* Not published in the official animate-ui registry (only plain "list" —
   no list-filter) — hand-authored to match the same convention as the
   generated icons in this folder, using lucide-react's exact path data.
   The three bars narrow like a funnel. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type ListFilterProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {},
    path2: {
      initial: { x: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { x: 1.5, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
    path3: {
      initial: { x: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { x: 3, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path1: {},
    path2: {
      initial: { x: 0 },
      animate: { x: [0, 1.5, 0], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
    path3: {
      initial: { x: 0 },
      animate: { x: [0, 3, 0], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ListFilterProps) {
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
        d="M2 5h20"
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M6 12h12"
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M9 19h6"
        variants={variants.path3}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function ListFilter(props: ListFilterProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  ListFilter,
  ListFilter as ListFilterIcon,
  type ListFilterProps,
  type ListFilterProps as ListFilterIconProps,
};
