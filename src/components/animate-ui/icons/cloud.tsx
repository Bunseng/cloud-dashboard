'use client';

/* Not published in the official animate-ui registry (only cloud-rain,
   cloud-sun, etc. — no plain "cloud") — hand-authored to match the same
   convention as the generated icons in this folder, using lucide-react's
   exact path data. A gentle float, like a drifting cloud. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type CloudProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {
      initial: { y: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
      animate: { y: -2, transition: { duration: 0.4, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path1: {
      initial: { y: 0 },
      animate: { y: [0, -2, 0], transition: { duration: 1.2, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: CloudProps) {
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
        d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Cloud(props: CloudProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Cloud,
  Cloud as CloudIcon,
  type CloudProps,
  type CloudProps as CloudIconProps,
};
