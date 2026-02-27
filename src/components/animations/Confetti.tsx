'use client';

import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti() {
  const fireConfetti = useCallback(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const fireSuccess = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7'],
      zIndex: 9999,
    });
  }, []);

  const fireFromElement = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { x, y },
      colors: ['#3b82f6', '#10b981', '#8b5cf6'],
      zIndex: 9999,
    });
  }, []);

  return { fireConfetti, fireSuccess, fireFromElement };
}

export function ConfettiOnMount({ trigger }: { trigger: boolean }) {
  const { fireConfetti } = useConfetti();

  useEffect(() => {
    if (trigger) {
      fireConfetti();
    }
  }, [trigger, fireConfetti]);

  return null;
}
