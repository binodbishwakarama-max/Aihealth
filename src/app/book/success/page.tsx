'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Calendar,
  ArrowLeft,
  Home,
  CalendarCheck,
  ExternalLink
} from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

interface AppointmentDetails {
  id: string;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  calendar_link?: string;
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('id');
  const calendarAdded = searchParams.get('calendar') === 'added';

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appointmentId) {
      fetch(`/api/appointments/${appointmentId}`)
        .then(res => res.json())
        .then(data => {
          // Handle both direct data and nested data response
          if (data.id) {
            setAppointment(data);
          } else if (data.appointment) {
            setAppointment(data.appointment);
          } else {
            // Use appointmentId if no data returned
            setAppointment({ id: appointmentId } as AppointmentDetails);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [appointmentId]);

  const appointmentTypeLabels: Record<string, string> = {
    general: 'General Consultation',
    followup: 'Follow-up Visit',
    specialist: 'Specialist Referral',
    urgent: 'Urgent Care',
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAddToCalendar = () => {
    // Redirect to Google OAuth
    window.location.href = `/api/auth/google?appointmentId=${appointmentId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0">
            <CardContent className="p-8 text-center">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-6"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </motion.div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Appointment Confirmed!
              </h1>
              <p className="text-gray-600 mb-8">
                Your appointment has been successfully booked.
              </p>

              {/* Appointment Details */}
              {appointment && !loading && appointment.appointment_date && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-teal-50 rounded-xl p-6 mb-8 text-left"
                >
                  <h2 className="font-semibold text-teal-800 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Appointment Details
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatDate(appointment.appointment_date)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {appointment.appointment_time}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {appointmentTypeLabels[appointment.appointment_type] || appointment.appointment_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="ml-2 font-mono text-sm text-gray-900">
                        {appointment.id?.slice(0, 8).toUpperCase() || appointmentId?.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Calendar Integration */}
              {calendarAdded ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8"
                >
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CalendarCheck className="h-5 w-5" />
                    <span className="font-medium">Added to Google Calendar!</span>
                  </div>
                  {appointment?.calendar_link && (
                    <a
                      href={appointment.calendar_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 mt-2"
                    >
                      View in Calendar <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mb-8"
                >
                  <Button
                    onClick={handleAddToCalendar}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-2 border-teal-200 hover:bg-teal-50"
                  >
                    <Calendar className="h-5 w-5 text-teal-600" />
                    <span>Add to Google Calendar</span>
                  </Button>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/book" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Book Another
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Return Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center text-gray-600"
        >
          <p className="text-sm">
            A confirmation email will be sent to your email address.
            <br />
            Please arrive 10 minutes before your scheduled appointment.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}
