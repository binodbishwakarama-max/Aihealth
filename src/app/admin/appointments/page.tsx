'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton } from '@clerk/nextjs';
import {
  CalendarCheck,
  ArrowLeft,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Calendar,
  LogIn,
  Eye,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface Appointment {
  id: string;
  user_id: string | null;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  appointment_type: string;
  appointment_date: string;
  appointment_time: string;
  symptoms: string | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  calendar_event_id: string | null;
  calendar_link: string | null;
  created_at: string;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  'no-show': { label: 'No Show', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
};

const typeLabels: Record<string, string> = {
  general: 'General Consultation',
  followup: 'Follow-up Visit',
  specialist: 'Specialist Referral',
  urgent: 'Urgent Care',
};

export default function AdminAppointmentsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchAppointments();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/appointments');

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      setError('Unable to load appointments. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    setUpdatingStatus(appointmentId);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setAppointments(appointments.map(apt =>
          apt.id === appointmentId ? { ...apt, status: newStatus as Appointment['status'] } : apt
        ));
        if (selectedAppointment?.id === appointmentId) {
          setSelectedAppointment({ ...selectedAppointment, status: newStatus as Appointment['status'] });
        }
      }
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAppointments(appointments.filter(apt => apt.id !== appointmentId));
        setSelectedAppointment(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch =
      apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient_phone.includes(searchTerm);
    const matchesStatus = !statusFilter || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort by date (upcoming first)
  const sortedAppointments = [...filteredAppointments].sort((a, b) =>
    new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
  );

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    today: appointments.filter(a =>
      new Date(a.appointment_date).toDateString() === new Date().toDateString()
    ).length,
  };

  // Show sign-in prompt if not authenticated
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 bg-teal-100 rounded-full mb-6">
              <LogIn className="h-12 w-12 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              You need to sign in to access appointment management.
            </p>
            <SignInButton mode="modal">
              <Button size="lg">
                <LogIn className="h-5 w-5 mr-2" />
                Sign In to Continue
              </Button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center text-sm text-gray-600 hover:text-teal-600 mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <CalendarCheck className="h-6 w-6 text-teal-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={fetchAppointments}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-teal-600">{stats.today}</p>
              <p className="text-xs text-gray-500">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              <p className="text-xs text-gray-500">Confirmed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-xs text-gray-500">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Appointments List */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Appointments ({sortedAppointments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {sortedAppointments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No appointments found</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {sortedAppointments.map((apt) => {
                      const StatusIcon = statusConfig[apt.status]?.icon || Clock;
                      return (
                        <div
                          key={apt.id}
                          onClick={() => setSelectedAppointment(apt)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedAppointment?.id === apt.id ? 'bg-teal-50' : ''
                            }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {apt.patient_name}
                                </h3>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[apt.status]?.color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig[apt.status]?.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {typeLabels[apt.appointment_type] || apt.appointment_type}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(apt.appointment_date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {apt.appointment_time}
                                </span>
                              </div>
                            </div>
                            <Eye className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedAppointment ? (
                <motion.div
                  key={selectedAppointment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Appointment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Patient Info */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Patient</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{selectedAppointment.patient_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a href={`mailto:${selectedAppointment.patient_email}`} className="text-teal-600 hover:underline">
                              {selectedAppointment.patient_email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a href={`tel:${selectedAppointment.patient_phone}`} className="text-teal-600 hover:underline">
                              {selectedAppointment.patient_phone}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Appointment Info */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Appointment</h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium">{formatDate(selectedAppointment.appointment_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Time</span>
                            <span className="font-medium">{selectedAppointment.appointment_time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Type</span>
                            <span className="font-medium">{typeLabels[selectedAppointment.appointment_type]}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Status</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedAppointment.status]?.color}`}>
                              {statusConfig[selectedAppointment.status]?.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Symptoms */}
                      {selectedAppointment.symptoms && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Symptoms</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                            {selectedAppointment.symptoms}
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {selectedAppointment.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                            {selectedAppointment.notes}
                          </p>
                        </div>
                      )}

                      {/* Status Actions */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Update Status</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant={selectedAppointment.status === 'confirmed' ? 'primary' : 'outline'}
                            onClick={() => updateStatus(selectedAppointment.id, 'confirmed')}
                            disabled={updatingStatus === selectedAppointment.id}
                            className="text-xs"
                          >
                            Confirmed
                          </Button>
                          <Button
                            size="sm"
                            variant={selectedAppointment.status === 'completed' ? 'primary' : 'outline'}
                            onClick={() => updateStatus(selectedAppointment.id, 'completed')}
                            disabled={updatingStatus === selectedAppointment.id}
                            className="text-xs"
                          >
                            Completed
                          </Button>
                          <Button
                            size="sm"
                            variant={selectedAppointment.status === 'cancelled' ? 'primary' : 'outline'}
                            onClick={() => updateStatus(selectedAppointment.id, 'cancelled')}
                            disabled={updatingStatus === selectedAppointment.id}
                            className="text-xs"
                          >
                            Cancelled
                          </Button>
                          <Button
                            size="sm"
                            variant={selectedAppointment.status === 'no-show' ? 'primary' : 'outline'}
                            onClick={() => updateStatus(selectedAppointment.id, 'no-show')}
                            disabled={updatingStatus === selectedAppointment.id}
                            className="text-xs"
                          >
                            No Show
                          </Button>
                        </div>
                      </div>

                      {/* Delete */}
                      <Button
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deleteAppointment(selectedAppointment.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Appointment
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Select an appointment to view details</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
