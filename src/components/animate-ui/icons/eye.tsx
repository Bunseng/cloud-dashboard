'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type EyeProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    outer: {},
    pupil: {
      initial: {
        scale: 1,
      },
      animate: {
        scale: [1, 0.6, 1],
        transition: { duration: 0.4, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    outer: {},
    pupil: {
      initial: {
        scale: 1,
      },
      animate: {
        scale: [1, 0.6, 1],
        transition: { duration: 1, ease: 'easeInOut', repeat: Infinity },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: EyeProps) {
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
        d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
        variants={variants.outer}
        initial="initial"
        animate={controls}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="3"
        variants={variants.pupil}
        initial="initial"
        animate={controls}
        style={{ transformOrigin: '12px 12px' }}
      />
    </motion.svg>
  );
}

function Eye(props: EyeProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { animations, Eye, Eye as EyeIcon, type EyeProps, type EyeProps as EyeIconProps };
