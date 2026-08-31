'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as users.tsx, using lucide-react's exact path
   data. The "+" pops in. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type UserPlusProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {},
    circle: {},
    line1: {
      initial: { scale: 1, opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { scale: 1.2, opacity: 0.7, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
    line2: {
      initial: { scale: 1, opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { scale: 1.2, opacity: 0.7, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path1: {},
    circle: {},
    line1: {
      initial: { scale: 1, opacity: 1 },
      animate: {
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
    line2: {
      initial: { scale: 1, opacity: 1 },
      animate: {
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: UserPlusProps) {
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
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.circle
        cx={9}
        cy={7}
        r={4}
        variants={variants.circle}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1={19}
        x2={19}
        y1={8}
        y2={14}
        variants={variants.line1}
        initial="initial"
        animate={controls}
        style={{ originX: '19px', originY: '11px' }}
      />
      <motion.line
        x1={22}
        x2={16}
        y1={11}
        y2={11}
        variants={variants.line2}
        initial="initial"
        animate={controls}
        style={{ originX: '19px', originY: '11px' }}
      />
    </motion.svg>
  );
}

function UserPlus(props: UserPlusProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  UserPlus,
  UserPlus as UserPlusIcon,
  type UserPlusProps,
  type UserPlusProps as UserPlusIconProps,
};
