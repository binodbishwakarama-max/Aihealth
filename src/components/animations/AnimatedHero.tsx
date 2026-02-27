'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Heart, Activity, Brain, Stethoscope, Pill, Thermometer, Syringe, Shield } from 'lucide-react';

const floatingIcons = [
  { Icon: Heart, color: 'text-rose-400', size: 32, delay: 0 },
  { Icon: Activity, color: 'text-teal-400', size: 28, delay: 0.5 },
  { Icon: Brain, color: 'text-cyan-400', size: 36, delay: 1 },
  { Icon: Stethoscope, color: 'text-emerald-400', size: 30, delay: 1.5 },
  { Icon: Pill, color: 'text-orange-400', size: 24, delay: 2 },
  { Icon: Thermometer, color: 'text-red-400', size: 28, delay: 2.5 },
  { Icon: Syringe, color: 'text-teal-400', size: 26, delay: 3 },
  { Icon: Shield, color: 'text-emerald-400', size: 32, delay: 3.5 },
];

interface FloatingIconProps {
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  size: number;
  delay: number;
  index: number;
}

function FloatingIcon({ Icon, color, size, delay, index }: FloatingIconProps) {
  const positions = [
    { left: '5%', top: '20%' },
    { left: '15%', top: '60%' },
    { left: '85%', top: '15%' },
    { left: '90%', top: '55%' },
    { left: '75%', top: '75%' },
    { left: '10%', top: '80%' },
    { left: '80%', top: '35%' },
    { left: '25%', top: '35%' },
  ];

  return (
    <motion.div
      className={`absolute ${color} opacity-20`}
      style={{ ...positions[index % positions.length] }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.1, 0.3, 0.1],
        scale: [1, 1.2, 1],
        y: [0, -20, 0],
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Icon className={`h-${size} w-${size}`} />
    </motion.div>
  );
}

interface AnimatedHeroProps {
  children: ReactNode;
}

export function AnimatedHero({ children }: AnimatedHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-emerald-50 min-h-[90vh] flex items-center">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(13, 148, 136, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(13, 148, 136, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(13, 148, 136, 0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Floating health icons */}
      {floatingIcons.map((icon, index) => (
        <FloatingIcon key={index} {...icon} index={index} />
      ))}

      {/* Glowing orbs */}
      <motion.div
        className="absolute top-20 left-20 w-64 h-64 bg-teal-400 rounded-full blur-[100px] opacity-20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400 rounded-full blur-[120px] opacity-20"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </section>
  );
}

export function AnimatedText({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function TypewriterText({ text }: { text: string }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.05, delay: index * 0.05 }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

export function PulsingButton({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(59, 130, 246, 0.4)',
          '0 0 0 10px rgba(59, 130, 246, 0)',
          '0 0 0 0 rgba(59, 130, 246, 0)',
        ],
      }}
      transition={{
        boxShadow: { duration: 2, repeat: Infinity },
      }}
    >
      {children}
    </motion.div>
  );
}
