'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. The flap "opens" briefly. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type WalletProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path1: {
      initial: { y: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { y: -1.5, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
    path2: {},
  } satisfies Record<string, Variants>,
  'default-loop': {
    path1: {
      initial: { y: 0 },
      animate: { y: [0, -1.5, 0], transition: { duration: 0.6, ease: 'easeInOut' } },
    },
    path2: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: WalletProps) {
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
        d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"
        variants={variants.path1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"
        variants={variants.path2}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Wallet(props: WalletProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Wallet,
  Wallet as WalletIcon,
  type WalletProps,
  type WalletProps as WalletIconProps,
};
