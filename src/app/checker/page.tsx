'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Select } from '@/components/ui';
import { AIAnalyzingAnimation } from '@/components/animations';
import { useLanguage } from '@/lib/i18n';
import { detectRedFlags } from '@/lib/redFlagEngine';

interface FormData {
  age: string;
  gender: string;
  symptoms: string;
  duration: string;
  severity: number;
}

interface FormErrors {
  age?: string;
  symptoms?: string;
  duration?: string;
}

export default function CheckerPage() {
  const router = useRouter();
  const { t, languageName } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    age: '',
    gender: '',
    symptoms: '',
    duration: '',
    severity: 5,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const DURATION_OPTIONS = [
    { value: '', label: t.checker.durationOptions.select },
    { value: 'less-than-day', label: t.checker.durationOptions.lessThan24 },
    { value: '1-3-days', label: t.checker.durationOptions.oneToThree },
    { value: '3-7-days', label: t.checker.durationOptions.threeToSeven },
    { value: '1-2-weeks', label: t.checker.durationOptions.oneToTwoWeeks },
    { value: '2-4-weeks', label: t.checker.durationOptions.twoToFourWeeks },
    { value: 'more-than-month', label: t.checker.durationOptions.moreThanMonth },
  ];

  const GENDER_OPTIONS = [
    { value: '', label: t.checker.genderOptions.select },
    { value: 'male', label: t.checker.genderOptions.male },
    { value: 'female', label: t.checker.genderOptions.female },
    { value: 'other', label: t.checker.genderOptions.other },
    { value: 'prefer-not-to-say', label: t.checker.genderOptions.preferNotToSay },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.age || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      newErrors.age = t.checker.validation.ageRange;
    }

    if (!formData.symptoms.trim() || formData.symptoms.trim().length < 10) {
      newErrors.symptoms = t.checker.validation.symptomsMin;
    }

    if (!formData.duration) {
      newErrors.duration = t.checker.validation.durationRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // ── Red Flag Emergency Detection (runs BEFORE AI call) ──
    const symptomsText = formData.symptoms.toLowerCase();
    const redFlag = detectRedFlags({
      age: parseInt(formData.age),
      mainSymptom: symptomsText,
      additionalSymptoms: [],
      severity: formData.severity,
    });

    if (redFlag.isEmergency) {
      router.push(`/emergency?reason=${encodeURIComponent(redFlag.triggerReason!)}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: parseInt(formData.age),
          gender: formData.gender,
          symptoms: formData.symptoms,
          duration: formData.duration,
          severity: formData.severity,
          language: languageName, // Pass language to the API
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze symptoms');
      }

      const data = await response.json();

      // Store result in sessionStorage for the results page
      sessionStorage.setItem('symptomResult', JSON.stringify({
        ...data,
        formData: {
          age: formData.age,
          gender: formData.gender,
          symptoms: formData.symptoms,
          duration: formData.duration,
          severity: formData.severity,
        }
      }));

      router.push('/result');
    } catch (err) {
      setError(t.common.error);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show analyzing animation when loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
        >
          <AIAnalyzingAnimation />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full mb-4 shadow-lg"
            whileHover={{ scale: 1.1, rotate: 5 }}
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(13, 148, 136, 0.4)',
                '0 0 0 15px rgba(13, 148, 136, 0)',
              ],
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity },
            }}
          >
            <Heart className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.checker.title}</h1>
          <p className="text-gray-600">
            {t.checker.subtitle}
          </p>
        </motion.div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t.checker.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Age and Gender Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label={t.checker.ageLabel}
                  type="number"
                  min="1"
                  max="120"
                  placeholder={t.checker.agePlaceholder}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  error={errors.age}
                />
                <Select
                  label={t.checker.genderLabel}
                  options={GENDER_OPTIONS}
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                />
              </div>

              {/* Symptoms */}
              <Textarea
                label={t.checker.symptomsLabel}
                placeholder={t.checker.symptomsPlaceholder}
                rows={5}
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                error={errors.symptoms}
                helperText=""
              />

              {/* Duration */}
              <Select
                label={t.checker.durationLabel}
                options={DURATION_OPTIONS}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                error={errors.duration}
              />

              {/* Severity Slider */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {t.checker.severityLabel}: <span className="text-teal-600 font-semibold">{formData.severity}/10</span>
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                {isLoading ? t.checker.analyzing : t.checker.analyzeButton}
              </Button>

              {/* Privacy Note */}
              <p className="text-xs text-center text-gray-500 max-w-sm mx-auto">
                {t.checker.disclaimer}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
