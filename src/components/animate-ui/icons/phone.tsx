'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. A little "ring" wiggle. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type PhoneProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path: {
      initial: { rotate: 0 },
      animate: {
        rotate: [0, -12, 12, -8, 8, 0],
        transition: { duration: 0.5, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: PhoneProps) {
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
        d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
        variants={variants.path}
        initial="initial"
        animate={controls}
        style={{ transformOrigin: '12px 12px' }}
      />
    </motion.svg>
  );
}

function Phone(props: PhoneProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Phone,
  Phone as PhoneIcon,
  type PhoneProps,
  type PhoneProps as PhoneIconProps,
};
