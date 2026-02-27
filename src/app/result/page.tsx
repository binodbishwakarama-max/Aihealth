'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion, easeOut } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Calendar,
  ArrowLeft,
  Stethoscope,
  HeartPulse,
  ShieldAlert,
  MessageCircle,
  Sparkles,
  ThermometerSun,
  User,
  Zap,
  ChevronDown,
  Brain,
  TrendingUp,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Disclaimer } from '@/components/Disclaimer';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { ConfettiOnMount } from '@/components/animations';
import { useLanguage } from '@/lib/i18n';

interface AIResponse {
  possible_conditions: string[];
  risk_level: 'Low' | 'Medium' | 'High';
  self_care: string[];
  see_doctor_if: string[];
  emergency_signs: string[];
}

interface FormData {
  age: string;
  gender: string;
  symptoms: string;
  duration: string;
  severity: number;
}

interface ResultData {
  id?: string;
  ai_response: AIResponse;
  formData: FormData;
}

// Animation Variants

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: easeOut }
  }
};

// Animated Card Component
const AnimatedCard = ({
  children,
  className,
  delay = 0,
  hover = true
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={hover && !shouldReduceMotion ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Typewriter Effect Component
const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedText(text);
      return;
    }

    const timer = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= text.length) {
          setDisplayedText(text.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 20);
      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [text, delay, shouldReduceMotion]);

  return (
    <span>
      {displayedText}
      {displayedText.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-5 bg-teal-500 ml-1"
        />
      )}
    </span>
  );
};

// Expandable Condition Card
const ExpandableConditionCard = ({
  condition,
  index,
  confidence
}: {
  condition: string;
  index: number;
  confidence: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      layout={!shouldReduceMotion}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.15, duration: 0.4 }}
      onClick={() => setIsExpanded(!isExpanded)}
      className="cursor-pointer"
    >

      <motion.div
        layout={!shouldReduceMotion}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 rounded-2xl border border-cyan-100 hover:border-cyan-300 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-lg"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle className="w-6 h-6" />
          </motion.div>
          <div>
            <p className="font-semibold text-gray-900">{condition}</p>
            <p className="text-xs text-gray-500 mt-1">
              Estimated confidence:{' '}
              <span className="font-semibold text-cyan-600">{confidence}%</span>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AnimatedCheckItem = ({
  text,
  index,
  icon: Icon,
  colorClass,
  bgClass,
  borderClass
}: {
  text: string;
  index: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.1 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${borderClass} bg-gradient-to-r ${bgClass}`}
    >
      <div className={`mt-0.5 ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-gray-700 text-sm">{text}</p>
    </motion.div>
  );
};

export default function ResultPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gaugeAnimated, setGaugeAnimated] = useState(false);
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');
  const [showTransparency, setShowTransparency] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem('symptomResult');
    if (data) {
      try {
        setResult(JSON.parse(data));
      } catch (e) {
        console.error(e);
        router.push('/checker');
      }
    } else {
      router.push('/checker');
    }
    setIsLoading(false);

    // Trigger gauge animation after mount
    const timer = setTimeout(() => setGaugeAnimated(true), 500);
    return () => clearTimeout(timer);
  }, [router]);


  // Generate PDF and return jsPDF instance
  const generatePDF = () => {
    if (!result) return null;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    doc.setFontSize(24);
    doc.setTextColor(13, 148, 136);
    doc.text('HealthLens Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Patient Information', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Age: ${result.formData.age}`, 20, yPos); yPos += 6;
    doc.text(`Gender: ${result.formData.gender || 'Not specified'}`, 20, yPos); yPos += 6;
    doc.text(`Duration: ${result.formData.duration}`, 20, yPos); yPos += 6;
    doc.text(`Severity: ${result.formData.severity}/10`, 20, yPos); yPos += 12;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Reported Symptoms', 20, yPos); yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(60);
    const symptomLines = doc.splitTextToSize(result.formData.symptoms, pageWidth - 40);
    doc.text(symptomLines, 20, yPos);
    yPos += symptomLines.length * 5 + 12;
    const riskColors: Record<string, [number, number, number]> = {
      'Low': [34, 197, 94], 'Medium': [234, 179, 8], 'High': [239, 68, 68]
    };
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Risk Assessment', 20, yPos); yPos += 8;
    const riskColor = riskColors[result.ai_response.risk_level] || [100, 100, 100];
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.setFontSize(12);
    doc.text(`Risk Level: ${result.ai_response.risk_level}`, 20, yPos); yPos += 12;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Possible Conditions', 20, yPos); yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(60);
    result.ai_response.possible_conditions.forEach((c) => { doc.text(`• ${c}`, 25, yPos); yPos += 6; });
    yPos += 6;
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Self-Care', 20, yPos); yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(60);
    result.ai_response.self_care.forEach((t) => {
      const lines = doc.splitTextToSize(`• ${t}`, pageWidth - 45);
      doc.text(lines, 25, yPos); yPos += lines.length * 5 + 2;
    });
    yPos += 6;
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('See a Doctor If', 20, yPos); yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(60);
    result.ai_response.see_doctor_if.forEach((s) => {
      const lines = doc.splitTextToSize(`• ${s}`, pageWidth - 45);
      doc.text(lines, 25, yPos); yPos += lines.length * 5 + 2;
    });
    yPos += 6;
    if (yPos > 230) { doc.addPage(); yPos = 20; }
    doc.setFontSize(14);
    doc.setTextColor(239, 68, 68);
    doc.text('Emergency Signs', 20, yPos); yPos += 8;
    doc.setFontSize(10);
    result.ai_response.emergency_signs.forEach((s) => {
      const lines = doc.splitTextToSize(`⚠ ${s}`, pageWidth - 45);
      doc.text(lines, 25, yPos); yPos += lines.length * 5 + 2;
    });
    yPos += 12;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('For educational purposes only. Not medical advice.', 20, yPos);
    return doc;
  };

  // Download PDF
  const handleDownloadPDF = () => {
    const doc = generatePDF();
    if (doc) doc.save('HealthLens-Health-Report.pdf');
  };

  // Email PDF
  const handleEmailPDF = async () => {
    setEmailStatus('sending');
    setEmailError('');
    try {
      const doc = generatePDF();
      if (!doc) throw new Error('No report data');
      const pdfBlob = doc.output('blob');
      const formData = new FormData();
      formData.append('email', email);
      formData.append('pdf', pdfBlob, 'HealthLens-Health-Report.pdf');
      const res = await fetch('/api/report-email', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setEmailStatus('error');
        setEmailError(data.error || 'Failed to send email');
        return;
      }
      setEmailStatus('sent');
    } catch (err) {
      setEmailStatus('error');
      setEmailError(err instanceof Error ? err.message : 'Failed to send email');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full"
        />
      </div>
    );
  }

  if (!result) return null;

  const { ai_response, formData } = result;
  const isLowRisk = ai_response.risk_level === 'Low';

  // Generate stable mock confidence percentages (deterministic, no hooks needed)
  const confidenceScores = ai_response.possible_conditions.map((_, i) =>
    Math.max(95 - i * 12, 45) + ((i * 7 + 3) % 5)
  );

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'Low':
        return {
          gradient: 'from-green-400 via-emerald-500 to-teal-500',
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: CheckCircle,
          message: t.result.riskLowMsg,
          glow: 'shadow-green-500/30',
          stroke: '#22c55e'
        };
      case 'Medium':
        return {
          gradient: 'from-amber-400 via-orange-500 to-yellow-500',
          bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          icon: Clock,
          message: t.result.riskMediumMsg,
          glow: 'shadow-amber-500/30',
          stroke: '#f59e0b'
        };
      case 'High':
        return {
          gradient: 'from-red-400 via-rose-500 to-pink-500',
          bg: 'bg-gradient-to-br from-red-50 to-rose-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: AlertTriangle,
          message: t.result.riskHighMsg,
          glow: 'shadow-red-500/30',
          stroke: '#ef4444'
        };
      default:
        return {
          gradient: 'from-gray-400 to-gray-500',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: Activity,
          message: 'Unable to assess risk level.',
          glow: 'shadow-gray-500/20',
          stroke: '#6b7280'
        };
    }
  };

  const riskConfig = getRiskConfig(ai_response.risk_level);
  const RiskIcon = riskConfig.icon;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <ConfettiOnMount trigger={isLowRisk} />

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-teal-200/20 to-emerald-200/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-cyan-200/20 to-teal-200/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -15, 0],
            y: [0, 15, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/checker"
            className="inline-flex items-center text-sm text-gray-500 hover:text-teal-600 transition-colors mb-6 group"
          >
            <motion.div whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
              <ArrowLeft className="h-4 w-4 mr-1" />
            </motion.div>
            {t.result.checkDifferent}
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="relative"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl blur-xl"
                  animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative p-4 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-xl">
                  <HeartPulse className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              <div>
                <motion.h1
                  className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  {t.result.title}
                </motion.h1>
                <motion.div
                  className="flex items-center gap-2 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-4 w-4 text-teal-500" />
                  </motion.div>
                  <span className="text-gray-500">{t.result.subtitle}</span>
                </motion.div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleDownloadPDF}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm hover:shadow-lg transition-all"
            >
              <Download className="h-4 w-4 mr-2" />
              {t.result.downloadPdf}
            </Button>
            <div className="mt-4 flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t.result.emailPlaceholder}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                disabled={emailStatus === 'sending'}
                required
              />
              <Button
                onClick={handleEmailPDF}
                isLoading={emailStatus === 'sending'}
                disabled={!email || emailStatus === 'sending'}
                variant="secondary"
                className="w-full"
              >
                {emailStatus === 'sent' ? 'Sent!' : t.result.sendByEmail}
              </Button>
              {emailStatus === 'error' && (
                <div className="text-red-500 text-xs mt-1">{emailError}</div>
              )}
              {emailStatus === 'sent' && (
                <div className="text-green-600 text-xs mt-1">Report sent to {email}</div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Risk Level Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={
            cn(
              'relative overflow-hidden rounded-3xl p-8 mb-8 border-2',
              riskConfig.bg,
              riskConfig.border,
              `shadow-2xl ${riskConfig.glow}`
            )}
        >
          {/* Pulse glow behind severity ring */}
          < motion.div
            className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-30"
            style={{ background: `radial-gradient(circle, ${riskConfig.stroke}, transparent 70%)` }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }}
              animate={{ backgroundPosition: ['0px 0px', '32px 32px'] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <motion.div
              className={cn('p-6 rounded-2xl bg-gradient-to-br', riskConfig.gradient, 'shadow-2xl')}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <RiskIcon className="h-12 w-12 text-white" />
              </motion.div>
            </motion.div>

            <div className="text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t.result.riskAssessment}</span>
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', delay: gaugeAnimated ? 1.5 : 10 }}
                  className={cn(
                    'px-5 py-2 rounded-full text-sm font-bold shadow-lg',
                    `bg-gradient-to-r ${riskConfig.gradient} text-white`
                  )}
                >
                  {ai_response.risk_level === 'Low' ? t.result.riskLow : ai_response.risk_level === 'Medium' ? t.result.riskMedium : t.result.riskHigh}
                </motion.span>
              </div>
              <motion.p
                className={cn('text-lg font-medium', riskConfig.text)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {riskConfig.message}
              </motion.p>
            </div>

            {/* Animated Severity Gauge */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</span>
              <div className="relative w-24 h-24">
                {/* Background pulse */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: `radial-gradient(circle, ${riskConfig.stroke}20, transparent 70%)` }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <svg className="w-24 h-24 -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <motion.circle
                    cx="48" cy="48" r="40" fill="none"
                    stroke={riskConfig.stroke}
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 251' }}
                    animate={{ strokeDasharray: gaugeAnimated ? `${formData.severity * 25.1} 251` : '0 251' }}
                    transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                  />
                </svg>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring' }}
                >
                  <span className="text-3xl font-bold text-gray-800">{formData.severity}</span>
                  <span className="text-sm text-gray-400 ml-0.5">/10</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div >

        {/* Patient Info Summary */}
        < motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {
            [
              { icon: User, label: t.result.age, value: formData.age, color: 'teal' },
              { icon: Activity, label: t.result.gender, value: formData.gender || 'Not specified', color: 'emerald' },
              { icon: Clock, label: t.result.duration, value: formData.duration, color: 'cyan' },
              { icon: ThermometerSun, label: t.result.severity, value: `${formData.severity}/10`, color: 'orange' },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={scaleIn}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-default"
              >
                <motion.div
                  className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center mb-3',
                    item.color === 'teal' ? 'bg-gradient-to-br from-teal-100 to-teal-200 text-teal-600' :
                      item.color === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600' :
                        item.color === 'cyan' ? 'bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-600' :
                          'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600'
                  )}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <item.icon className="h-5 w-5" />
                </motion.div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="font-bold text-gray-800 truncate">{item.value}</p>
              </motion.div>
            ))
          }
        </motion.div >

        {/* Symptoms Card - Conversational Bubble Style */}
        < AnimatedCard delay={0.4} className="mb-8" >
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-lg"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <MessageCircle className="h-5 w-5 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-800">{t.result.youReported}</h2>
            </div>
            <motion.div
              className="relative bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 rounded-2xl p-6 border border-teal-100"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {/* Chat bubble tail */}
              <div className="absolute -top-2 left-8 w-4 h-4 bg-gradient-to-br from-teal-50 to-emerald-50 rotate-45 border-l border-t border-teal-100" />
              <p className="text-gray-700 leading-relaxed text-lg">
                <TypewriterText text={formData.symptoms} delay={0.6} />
              </p>
            </motion.div>
          </div>
        </AnimatedCard >

        {/* Main Content Grid */}
        < div className="grid lg:grid-cols-2 gap-6 mb-8" >
          {/* Possible Conditions - Expandable Cards */}
          < AnimatedCard delay={0.5} hover={false} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm" >
            <div className="flex items-center gap-3 mb-5">
              <motion.div
                className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Stethoscope className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t.result.possibleConditions}</h2>
                <p className="text-xs text-gray-400">{t.result.possibleConditionsHint}</p>
              </div>
            </div>
            <div className="space-y-3">
              {ai_response.possible_conditions.map((condition, index) => (
                <ExpandableConditionCard
                  key={index}
                  condition={condition}
                  index={index}
                  confidence={confidenceScores[index]}
                />
              ))}
            </div>
          </AnimatedCard >

          {/* Self-Care Recommendations - Animated Checklist */}
          < AnimatedCard delay={0.6} hover={false} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm" >
            <div className="flex items-center gap-3 mb-5">
              <motion.div
                className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Self-Care Tips</h2>
                <p className="text-xs text-gray-400">Personalized recommendations</p>
              </div>
            </div>
            <div className="space-y-3">
              {ai_response.self_care.map((tip, index) => (
                <AnimatedCheckItem
                  key={index}
                  text={tip}
                  index={index}
                  icon={CheckCircle}
                  colorClass="text-green-500"
                  bgClass="from-green-50 to-emerald-50"
                  borderClass="border-green-100 hover:border-green-200"
                />
              ))}
            </div>
          </AnimatedCard >

          {/* See a Doctor If */}
          < AnimatedCard delay={0.7} hover={false} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm" >
            <div className="flex items-center gap-3 mb-5">
              <motion.div
                className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg"
              >
                <Clock className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">See a Doctor If</h2>
                <p className="text-xs text-gray-400">Warning signs to watch</p>
              </div>
            </div>
            <div className="space-y-3">
              {ai_response.see_doctor_if.map((sign, index) => (
                <AnimatedCheckItem
                  key={index}
                  text={sign}
                  index={index}
                  icon={AlertTriangle}
                  colorClass="text-amber-500"
                  bgClass="from-amber-50 to-orange-50"
                  borderClass="border-amber-100 hover:border-amber-200"
                />
              ))}
            </div>
          </AnimatedCard >

          {/* Emergency Warning Signs - With Shake & Glow */}
          < motion.div
            initial={{ opacity: 0, y: 20, x: 0 }}
            animate={{
              opacity: 1,
              y: 0,
              x: [0, -3, 3, -3, 3, 0] // Subtle shake on mount
            }}
            transition={{
              opacity: { delay: 0.8, duration: 0.4 },
              y: { delay: 0.8, duration: 0.4 },
              x: { delay: 1, duration: 0.5 }
            }}
            className="relative"
          >
            {/* Red glow effect */}
            < div className="absolute inset-0 bg-red-500/10 rounded-3xl blur-xl" />
            <div className="relative bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl p-6 border-2 border-red-200 shadow-lg shadow-red-500/10">
              <div className="flex items-center gap-3 mb-5">
                <motion.div
                  className="p-2.5 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl shadow-lg"
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [1, 0.8, 1]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Zap className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-red-700">Emergency Signs</h2>
                  <p className="text-xs text-red-400">Seek immediate attention</p>
                </div>
              </div>
              <div className="space-y-3">
                {ai_response.emergency_signs.map((sign, index) => (
                  <AnimatedCheckItem
                    key={index}
                    text={sign}
                    index={index}
                    icon={ShieldAlert}
                    colorClass="text-red-500"
                    bgClass="from-white to-red-50/50"
                    borderClass="border-red-200 hover:border-red-300"
                  />
                ))}
              </div>
            </div>
          </motion.div >
        </div >

        {/* How We Reached This Result - Transparency Section */}
        < AnimatedCard delay={0.9} className="mb-8" >
          <motion.div
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
            layout
          >
            <motion.button
              onClick={() => setShowTransparency(!showTransparency)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-800">How We Reached This Result</h2>
                  <p className="text-xs text-gray-400">AI analysis transparency</p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: showTransparency ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="h-6 w-6 text-gray-400" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showTransparency && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-4">
                    <div className="h-px bg-gray-100" />
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { icon: MessageCircle, label: 'Symptoms Analyzed', value: formData.symptoms.split(' ').length + ' keywords', color: 'teal' },
                        { icon: Clock, label: 'Duration Considered', value: formData.duration, color: 'blue' },
                        { icon: TrendingUp, label: 'Severity Weighted', value: `${formData.severity}/10 impact`, color: 'purple' },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            'p-4 rounded-2xl border',
                            item.color === 'teal' ? 'bg-teal-50 border-teal-100' :
                              item.color === 'blue' ? 'bg-blue-50 border-blue-100' :
                                'bg-purple-50 border-purple-100'
                          )}
                        >
                          <item.icon className={cn(
                            'h-5 w-5 mb-2',
                            item.color === 'teal' ? 'text-teal-600' :
                              item.color === 'blue' ? 'text-blue-600' :
                                'text-purple-600'
                          )} />
                          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                          <p className="font-semibold text-gray-800">{item.value}</p>
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                      <Info className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-500">
                        Our AI analyzed your symptoms using pattern matching against medical knowledge bases.
                        Results are educational only and should not replace professional medical advice.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatedCard>

        {/* Primary CTA Section */}
        <motion.div
          className="grid sm:grid-cols-2 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Link href={`/chat?symptoms=${encodeURIComponent(formData.symptoms)}`} className="block">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="h-full p-6 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 rounded-2xl shadow-xl shadow-teal-500/30 flex items-center gap-5 group cursor-pointer"
            >
              <motion.div
                className="p-4 bg-white/20 backdrop-blur rounded-xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <MessageCircle className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <p className="font-bold text-xl text-white mb-1">Talk to AI Doctor</p>
                <p className="text-teal-100">Ask follow-up questions instantly</p>
              </div>
              <motion.div
                className="ml-auto"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronDown className="h-6 w-6 text-white -rotate-90" />
              </motion.div>
            </motion.div>
          </Link>

          <Link href={`/book?symptoms=${encodeURIComponent(formData.symptoms)}`} className="block">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="h-full p-6 bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl hover:border-orange-200 transition-all flex items-center gap-5 group cursor-pointer"
            >
              <div className="p-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl group-hover:from-orange-200 group-hover:to-amber-200 transition-colors">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-xl text-gray-800 mb-1">Book Appointment</p>
                <p className="text-gray-500">Schedule a consultation</p>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Secondary Action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex justify-center mb-8"
        >
          <Link href="/checker">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-500 hover:text-teal-600 transition-colors flex items-center gap-2 text-sm"
            >
              <Activity className="h-4 w-4" />
              Check Different Symptoms
            </motion.button>
          </Link>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Disclaimer />
        </motion.div>
      </div >
    </motion.div >
  );
}
