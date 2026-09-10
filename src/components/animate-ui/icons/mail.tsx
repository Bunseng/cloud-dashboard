'use client';

/* Not published in the official animate-ui registry — hand-authored to
   match the same convention as the generated icons in this folder, using
   lucide-react's exact path data. The envelope flap draws in. */

import * as React from 'react';
import { motion, type Variants } from 'motion/react';

import {
  getVariants,
  useAnimateIconContext,
  IconWrapper,
  type IconProps,
} from '@/components/animate-ui/icons/icon';

type MailProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    path: {
      initial: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: { duration: 0.4, ease: 'easeInOut' },
      },
    },
    rect: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: MailProps) {
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
        d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"
        variants={variants.path}
        initial="initial"
        animate={controls}
      />
      <motion.rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="2"
        variants={variants.rect}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Mail(props: MailProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Mail,
  Mail as MailIcon,
  type MailProps,
  type MailProps as MailIconProps,
};
