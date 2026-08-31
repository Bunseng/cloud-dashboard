'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. A quick spark flash. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type ZapProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {
      initial: { scale: 1, opacity: 1, transition: { duration: 0.25, ease: 'easeInOut' } },
      animate: { scale: 1.15, opacity: 0.85, transition: { duration: 0.25, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    path1: {
      initial: { scale: 1, opacity: 1 },
      animate: {
        scale: [1, 1.15, 1],
        opacity: [1, 0.85, 1],
        transition: { duration: 0.5, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: ZapProps) {
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
        d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"
        variants={variants.path1}
        initial="initial"
        animate={controls}
        style={{ originX: '0.5', originY: '0.5' }}
      />
    </motion.svg>
  );
}

function Zap(props: ZapProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Zap,
  Zap as ZapIcon,
  type ZapProps,
  type ZapProps as ZapIconProps,
};
