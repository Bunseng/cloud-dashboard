'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data (History aliases rotate-ccw-clock). The
   clock hand sweeps back. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type HistoryProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {},
    path2: {},
    path3: {
      initial: { rotate: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
      animate: { rotate: -90, transition: { duration: 0.4, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path1: {},
    path2: {},
    path3: {
      initial: { rotate: 0 },
      animate: { rotate: [0, -90, 0], transition: { duration: 0.8, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: HistoryProps) {
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
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M3 3v5h5"
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M12 7v5l4 2"
        variants={variants.path3}
        initial="initial"
        animate={controls}
        style={{ originX: '12px', originY: '12px' }}
      />
    </motion.svg>
  );
}

function History(props: HistoryProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  History,
  History as HistoryIcon,
  type HistoryProps,
  type HistoryProps as HistoryIconProps,
};
