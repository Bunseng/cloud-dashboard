'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. A quick "scan" pulse. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type QrCodeProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: { scale: 1, opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
      animate: { scale: 1.06, opacity: 0.7, transition: { duration: 0.3, ease: 'easeInOut' } },
    },
  } satisfies Record<string, Variants>,
  'default-loop': {
    group: {
      initial: { scale: 1, opacity: 1 },
      animate: {
        scale: [1, 1.06, 1],
        opacity: [1, 0.7, 1],
        transition: { duration: 0.6, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: QrCodeProps) {
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
      <motion.g
        variants={variants.group}
        initial="initial"
        animate={controls}
        style={{ originX: '0.5', originY: '0.5' }}
      >
        <rect width={5} height={5} x={3} y={3} rx={1} />
        <rect width={5} height={5} x={16} y={3} rx={1} />
        <rect width={5} height={5} x={3} y={16} rx={1} />
        <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
        <path d="M21 21v.01" />
        <path d="M12 7v3a2 2 0 0 1-2 2H7" />
        <path d="M3 12h.01" />
        <path d="M12 3h.01" />
        <path d="M12 16v.01" />
        <path d="M16 12h1" />
        <path d="M21 12v.01" />
        <path d="M12 21v-1" />
      </motion.g>
    </motion.svg>
  );
}

function QrCode(props: QrCodeProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  QrCode,
  QrCode as QrCodeIcon,
  type QrCodeProps,
  type QrCodeProps as QrCodeIconProps,
};
