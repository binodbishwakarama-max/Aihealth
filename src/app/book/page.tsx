'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  CalendarCheck
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Select } from '@/components/ui';
import { useUser } from '@clerk/nextjs';
import { useLanguage } from '@/lib/i18n';

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
];

const APPOINTMENT_TYPES = [
  { value: '', label: 'Select appointment type' },
  { value: 'general', label: 'General Consultation' },
  { value: 'followup', label: 'Follow-up Visit' },
  { value: 'specialist', label: 'Specialist Referral' },
  { value: 'urgent', label: 'Urgent Care' },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  appointmentType: string;
  preferredDate: string;
  preferredTime: string;
  symptoms: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  appointmentType?: string;
  preferredDate?: string;
  preferredTime?: string;
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>(TIME_SLOTS);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    appointmentType: '',
    preferredDate: '',
    preferredTime: '',
    symptoms: searchParams.get('symptoms') || '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Pre-fill user data if logged in
  useEffect(() => {
    if (isLoaded && user) {
      setFormData(prev => ({
        ...prev,
        name: user.fullName || prev.name,
        email: user.primaryEmailAddress?.emailAddress || prev.email,
      }));
    }
  }, [isLoaded, user]);

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Check available slots when date changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!formData.preferredDate) {
        setAvailableSlots(TIME_SLOTS);
        return;
      }

      try {
        const response = await fetch(`/api/appointments/availability?date=${formData.preferredDate}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.availableSlots || TIME_SLOTS);
        }
      } catch (err) {
        console.error('Failed to check availability:', err);
        setAvailableSlots(TIME_SLOTS);
      }
    };

    checkAvailability();
  }, [formData.preferredDate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your full name';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.appointmentType) {
      newErrors.appointmentType = 'Please select an appointment type';
    }

    if (!formData.preferredDate) {
      newErrors.preferredDate = 'Please select a preferred date';
    }

    if (!formData.preferredTime) {
      newErrors.preferredTime = 'Please select a preferred time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to book appointment');
      }

      const data = await response.json();
      setBookingId(data.id);
      setIsSuccess(true);
      // Redirect to success page with calendar integration
      router.push(`/book/success?id=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 py-12">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4"
                >
                  <CheckCircle className="h-10 w-10 text-teal-600" />
                </motion.div>
                <h1 className="text-2xl font-bold text-white mb-2">{t.book.booking}</h1>
                <p className="text-teal-100">{t.common.loading}</p>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-500">Booking ID</span>
                    <span className="font-mono text-sm font-medium">{bookingId?.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium">
                      {new Date(formData.preferredDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-500">Time</span>
                    <span className="font-medium">{formData.preferredTime}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium capitalize">{formData.appointmentType.replace('-', ' ')}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  A confirmation email has been sent to <strong>{formData.email}</strong>
                </p>

                <div className="flex flex-col gap-3">
                  <Link href="/">
                    <Button className="w-full">Return to Home</Button>
                  </Link>
                  <Link href="/checker">
                    <Button variant="outline" className="w-full">Check More Symptoms</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/result"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.book.backToResults}
          </Link>
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl"
            >
              <CalendarCheck className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.book.title}</h1>
              <p className="text-gray-600">{t.book.subtitle}</p>
            </div>
          </div>
        </motion.div>

        {/* Booking Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t.book.appointmentDetails}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {t.book.personalInfo}
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label={`${t.book.fullName} *`}
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      error={errors.name}
                      icon={<User className="h-4 w-4 text-gray-400" />}
                    />
                    <Input
                      label={`${t.book.phone} *`}
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      error={errors.phone}
                      icon={<Phone className="h-4 w-4 text-gray-400" />}
                    />
                  </div>

                  <Input
                    label={`${t.book.email} *`}
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    icon={<Mail className="h-4 w-4 text-gray-400" />}
                  />
                </div>

                {/* Appointment Details */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {t.book.appointmentDetails}
                  </h3>

                  <Select
                    label={`${t.book.appointmentType} *`}
                    options={APPOINTMENT_TYPES}
                    value={formData.appointmentType}
                    onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                    error={errors.appointmentType}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <Calendar className="inline h-4 w-4 mr-1 text-gray-400" />
                        {t.book.preferredDate} *
                      </label>
                      <input
                        type="date"
                        min={getMinDate()}
                        max={getMaxDate()}
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value, preferredTime: '' })}
                        onInput={(e) => {
                          const val = (e.target as HTMLInputElement).value;
                          if (val && val !== formData.preferredDate) {
                            setFormData(prev => ({ ...prev, preferredDate: val, preferredTime: '' }));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${errors.preferredDate ? 'border-red-300' : 'border-gray-300'
                          }`}
                      />
                      {errors.preferredDate && (
                        <p className="text-sm text-red-600">{errors.preferredDate}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <Clock className="inline h-4 w-4 mr-1 text-gray-400" />
                        {t.book.preferredTime} *
                      </label>
                      {!formData.preferredDate ? (
                        <p className="text-sm text-gray-500 py-2">{t.book.selectDateFirst}</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setFormData({ ...formData, preferredTime: slot })}
                              className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-all ${formData.preferredTime === slot
                                ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                                }`}
                            >
                              {slot}
                            </button>
                          ))}
                          {availableSlots.length === 0 && (
                            <p className="col-span-3 text-sm text-gray-500 py-2">{t.book.noSlots}</p>
                          )}
                        </div>
                      )}
                      {errors.preferredTime && (
                        <p className="text-sm text-red-600">{errors.preferredTime}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {t.book.additionalInfo}
                  </h3>

                  {formData.symptoms && (
                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <p className="text-sm font-medium text-teal-800 mb-1">{t.book.symptomsFromCheck}</p>
                      <p className="text-sm text-teal-700">{formData.symptoms}</p>
                    </div>
                  )}

                  <Textarea
                    label={t.book.additionalNotes}
                    placeholder={t.book.notesPlaceholder}
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                >
                  {isLoading ? t.book.booking : t.book.confirmBooking}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  {t.book.cancellationPolicy}
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
