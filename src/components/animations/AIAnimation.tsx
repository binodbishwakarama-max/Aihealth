'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Heart, Activity, Stethoscope } from 'lucide-react';

export function AIAnalyzingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* DNA Helix Animation */}
      <div className="relative w-48 h-48 mb-8">
        {/* Orbiting icons */}
        {[Brain, Heart, Activity, Stethoscope].map((Icon, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 3,
              delay: index * 0.75,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <motion.div
              style={{
                x: -12,
                y: -60 - index * 10,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                delay: index * 0.3,
                repeat: Infinity,
              }}
            >
              <Icon className={`h-6 w-6 ${index === 0 ? 'text-teal-500' :
                  index === 1 ? 'text-rose-500' :
                    index === 2 ? 'text-emerald-500' :
                      'text-cyan-500'
                }`} />
            </motion.div>
          </motion.div>
        ))}

        {/* Center pulsing circle */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 0 0 0 rgba(13, 148, 136, 0.4)',
              '0 0 0 20px rgba(13, 148, 136, 0)',
              '0 0 0 0 rgba(13, 148, 136, 0)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-10 w-10 text-white" />
          </div>
        </motion.div>

        {/* Outer rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-teal-200"
            style={{
              width: 80 + ring * 40,
              height: 80 + ring * 40,
            }}
            animate={{
              rotate: ring % 2 === 0 ? 360 : -360,
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              rotate: {
                duration: 10 + ring * 5,
                repeat: Infinity,
                ease: 'linear',
              },
              opacity: {
                duration: 2,
                repeat: Infinity,
              },
            }}
          />
        ))}
      </div>

      {/* Analyzing text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-2">AI is Analyzing</h3>
        <div className="flex items-center justify-center gap-1">
          <span className="text-gray-600">Processing your symptoms</span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ...
          </motion.span>
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="w-64 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 3, ease: 'easeInOut' }}
        />
      </div>

      {/* Fun facts that cycle */}
      <motion.div
        className="mt-8 text-center max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <RotatingFacts />
      </motion.div>
    </div>
  );
}

function RotatingFacts() {
  const facts = [
    '🧠 Analyzing symptom patterns...',
    '💡 Checking medical knowledge base...',
    '📊 Calculating risk assessment...',
    '✨ Generating personalized recommendations...',
    '🔍 Identifying possible conditions...',
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % facts.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [facts.length]);

  return (
    <motion.div
      className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        {facts[index]}
      </motion.span>
    </motion.div>
  );
}

export function SuccessAnimation() {
  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <motion.div
        className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(34, 197, 94, 0.4)',
            '0 0 0 20px rgba(34, 197, 94, 0)',
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <motion.svg
          className="w-10 h-10 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.path
            d="M5 13l4 4L19 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}
