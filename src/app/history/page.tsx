'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Activity, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { SymptomCheck } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';

export default function HistoryPage() {
  const [checks, setChecks] = useState<SymptomCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/history', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to view your history.');
          return;
        }
        if (response.status === 403) {
          setError('You do not have permission to view this page.');
          return;
        }
        const message = await response.text();
        setError(message || 'Something went wrong.');
        return;
      }

      const { data } = await response.json();
      setChecks(data || []);
    } catch (err) {
      setError('Network error. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-100 rounded-lg">
              <History className="h-6 w-6 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{t.history.title}</h1>
          </div>
          <p className="text-gray-600">{t.history.subtitle}</p>
        </div>

        {error && (
          <Card className="mb-8">
            <CardContent className="flex items-center gap-3 py-6">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <p className="text-gray-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {!error && checks.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t.history.noChecks}</h3>
              <p className="text-gray-500 mb-6">
                {t.history.noChecksDesc}
              </p>
              <Link href="/checker">
                <Button>{t.history.checkNow}</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {checks.length > 0 && (
          <div className="space-y-4">
            {checks.map((check) => (
              <Card
                key={check.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  // Store result and navigate to result page
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
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="risk" risk={check.risk_level}>
                          {check.risk_level} {t.history.risk}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(check.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-1 truncate">
                        {check.symptoms.length > 100
                          ? `${check.symptoms.substring(0, 100)}...`
                          : check.symptoms
                        }
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{t.history.age}: {check.age}</span>
                        <span>{t.history.duration}: {check.duration}</span>
                        <span>{t.history.severity}: {check.severity}/10</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
