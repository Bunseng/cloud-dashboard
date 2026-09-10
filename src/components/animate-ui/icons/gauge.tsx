'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. The needle gives a little swing. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type GaugeProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    needle: {
      initial: { rotate: 0 },
      animate: { rotate: [0, -20, 0], transition: { duration: 0.5, ease: 'easeInOut' } },
    },
    path: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: GaugeProps) {
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
        d="m12 14 4-4"
        variants={variants.needle}
        initial="initial"
        animate={controls}
        style={{ originX: '12px', originY: '14px' }}
      />
      <motion.path
        d="M3.34 19a10 10 0 1 1 17.32 0"
        variants={variants.path}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Gauge(props: GaugeProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Gauge,
  Gauge as GaugeIcon,
  type GaugeProps,
  type GaugeProps as GaugeIconProps,
};
