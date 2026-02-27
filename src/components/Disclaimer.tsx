import { Info } from 'lucide-react';

export function Disclaimer() {
  return (
    <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
      <Info className="h-3 w-3" />
      <span>For educational purposes only. Not medical advice. Consult a doctor for health concerns.</span>
    </p>
  );
}
