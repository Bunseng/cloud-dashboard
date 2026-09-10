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

type UserRoundProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    circle: {
      initial: { y: 0 },
      animate: {
        y: [0, -1.5, 0],
        transition: { duration: 0.4, ease: 'easeInOut' },
      },
    },
    path: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: UserRoundProps) {
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
      <motion.circle
        cx="12"
        cy="8"
        r="5"
        variants={variants.circle}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M20 21a8 8 0 0 0-16 0"
        variants={variants.path}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function UserRound(props: UserRoundProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  UserRound,
  UserRound as UserRoundIcon,
  type UserRoundProps,
  type UserRoundProps as UserRoundIconProps,
};
