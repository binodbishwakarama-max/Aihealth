'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
  Gauge,
  Trash2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  LogIn
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Select, Input } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface SymptomCheck {
  id: string;
  user_id: string;
  age: number;
  gender: string | null;
  symptoms: string;
  duration: string;
  severity: number;
  risk_level: 'Low' | 'Medium' | 'High';
  ai_response: object;
  created_at: string;
}

interface Stats {
  totalChecks: number;
  highRiskCount: number;
  uniqueUsers: number;
  avgSeverity: number | string;
  checksToday: number;
  checksThisWeek: number;
  dailyStats: Array<{
    date: string;
    total: number;
    high: number;
    medium: number;
    low: number;
  }>;
  symptomTrends: Array<{
    symptom: string;
    count: number;
    trend: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    time: string;
    severity: string;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const [checks, setChecks] = useState<SymptomCheck[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    riskLevel: '',
    page: 1,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isLoaded) return;

    try {
      setIsLoading(true);
      setError(null);

      if (!isSignedIn) {
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams();

      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.riskLevel) params.set('riskLevel', filters.riskLevel);
      params.set('page', filters.page.toString());

      const response = await fetch(`/api/admin/checks?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to continue.');
          return;
        }
        if (response.status === 403) {
          setError('You do not have permission to access the admin dashboard.');
          return;
        }
        const message = await response.text();
        setError(message || 'Something went wrong.');
        return;
      }

      const data = await response.json();
      setChecks(data.data || []);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoaded, isSignedIn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (checkId: string) => {
    if (!confirm('Are you sure you want to delete this check?')) return;

    setDeleteLoading(checkId);
    try {
      const response = await fetch(`/api/admin/checks?id=${checkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChecks(checks.filter(c => c.id !== checkId));
        fetchData(); // Refresh stats
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const exportCSV = () => {
    if (!checks.length) {
      alert('No data to export. Please make sure there are symptom checks in the database.');
      return;
    }

    const headers = ['ID', 'User ID', 'Age', 'Gender', 'Symptoms', 'Duration', 'Severity', 'Risk Level', 'Date'];
    const rows = checks.map(check => [
      check.id,
      check.user_id || 'Anonymous',
      check.age || '',
      check.gender || 'N/A',
      `"${(check.symptoms || '').replace(/"/g, '""')}"`,
      check.duration || '',
      check.severity || '',
      check.risk_level || '',
      check.created_at ? new Date(check.created_at).toISOString() : '',
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthlens-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatChartDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
              You need to sign in to access the admin dashboard and view analytics.
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

  if (isLoading && !stats) {
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
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-teal-100 rounded-lg">
                <LayoutDashboard className="h-6 w-6 text-teal-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">Monitor symptom checks and clinic analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => fetchData()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/admin/appointments">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Appointments
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Button onClick={exportCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-sm text-gray-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Checks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalChecks || 0}</p>
                </div>
                <div className="p-2 bg-teal-100 rounded-full">
                  <Activity className="h-5 w-5 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">High Risk</p>
                  <p className="text-2xl font-bold text-red-600">{stats?.highRiskCount || 0}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Unique Users</p>
                  <p className="text-2xl font-bold text-purple-600">{stats?.uniqueUsers || 0}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Avg Severity</p>
                  <p className="text-2xl font-bold text-orange-600">{stats?.avgSeverity || 0}/10</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-full">
                  <Gauge className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Today</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.checksToday || 0}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">This Week</p>
                  <p className="text-2xl font-bold text-cyan-600">{stats?.checksThisWeek || 0}</p>
                </div>
                <div className="p-2 bg-cyan-100 rounded-full">
                  <TrendingUp className="h-5 w-5 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Daily Usage (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.dailyStats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatChartDate} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => formatChartDate(label as string)}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="low" name="Low Risk" fill="#22c55e" stackId="a" />
                    <Bar dataKey="medium" name="Medium Risk" fill="#eab308" stackId="a" />
                    <Bar dataKey="high" name="High Risk" fill="#ef4444" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Symptom Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Top Symptoms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(stats?.symptomTrends || []).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.symptom}</p>
                        <p className="text-sm text-gray-500">{item.count} cases</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${item.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {Math.abs(item.trend)}%
                    </div>
                  </div>
                ))}
                {(!stats?.symptomTrends || stats.symptomTrends.length === 0) && (
                  <p className="text-gray-500 text-sm text-center py-8">No symptom data yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              {(filters.startDate || filters.endDate || filters.riskLevel) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFilters({ startDate: '', endDate: '', riskLevel: '', page: 1 })}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <Input
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                />
                <Select
                  label="Risk Level"
                  options={[
                    { value: '', label: 'All Levels' },
                    { value: 'Low', label: 'Low' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High', label: 'High' },
                  ]}
                  value={filters.riskLevel}
                  onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value, page: 1 })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Symptom Checks</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symptoms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {checks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No symptom checks found
                      </td>
                    </tr>
                  ) : (
                    checks.map((check) => (
                      <tr key={check.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {check.user_id ? check.user_id.slice(0, 8) + '...' : 'Anonymous'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Age: {check.age}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {check.symptoms}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="risk" risk={check.risk_level}>
                            {check.risk_level}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(check.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                sessionStorage.setItem('symptomResult', JSON.stringify({
                                  id: check.id,
                                  ai_response: check.ai_response,
                                  formData: {
                                    age: check.age.toString(),
                                    gender: check.gender || '',
                                    symptoms: check.symptoms,
                                    duration: check.duration,
                                    severity: check.severity,
                                  }
                                }));
                                window.location.href = '/result';
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(check.id)}
                              disabled={deleteLoading === check.id}
                              className="text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              {deleteLoading === check.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
