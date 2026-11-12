'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. The lid lifts off the box. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type GiftProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    lid: {
      initial: { y: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { y: -1.5, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
    box: {
      initial: { y: 0 },
      animate: { y: 0 },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    lid: {
      initial: { y: 0 },
      animate: {
        y: [0, -1.5, 0],
        transition: { duration: 0.7, ease: 'easeInOut' },
      },
    },
    box: {
      initial: { y: 0 },
      animate: { y: 0 },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: GiftProps) {
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
      <motion.g variants={variants.lid} initial="initial" animate={controls}>
        <rect width={20} height={5} x={2} y={7} rx={1} />
        <path d="M7.5 7a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
      </motion.g>
      <motion.g variants={variants.box} initial="initial" animate={controls}>
        <path d="M12 12v10" />
        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      </motion.g>
    </motion.svg>
  );
}

function Gift(props: GiftProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { animations, Gift, Gift as GiftIcon, type GiftProps, type GiftProps as GiftIconProps };
