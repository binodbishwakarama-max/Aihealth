'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { ArrowLeft, Settings, Save, Palette, Type, Link2, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';

interface AppSettings {
  app_name: string;
  logo_url: string | null;
  primary_color: string;
  booking_url: string | null;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    app_name: 'CareAI',
    logo_url: null,
    primary_color: '#3b82f6',
    booking_url: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings({
        app_name: data.app_name || 'CareAI',
        logo_url: data.logo_url || '',
        primary_color: data.primary_color || '#3b82f6',
        booking_url: data.booking_url || '',
      });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          logo_url: settings.logo_url || null,
          booking_url: settings.booking_url || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Settings className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">White Label Settings</h1>
              <p className="text-gray-600">Customize the appearance of your HealthLens instance</p>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>Branding Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* App Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Type className="h-4 w-4" />
                App Name
              </label>
              <Input
                value={settings.app_name}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                placeholder="CareAI"
              />
              <p className="text-xs text-gray-500">
                This name will appear in the header, footer, and throughout the application.
              </p>
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ImageIcon className="h-4 w-4" />
                Logo URL
              </label>
              <Input
                value={settings.logo_url || ''}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-gray-500">
                Enter the URL of your logo image. Recommended size: 32x32px or 40x40px.
              </p>
              {settings.logo_url && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <NextImage
                    src={settings.logo_url}
                    alt="Logo preview"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Palette className="h-4 w-4" />
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                This color will be used for buttons, links, and accent elements.
              </p>
            </div>

            {/* Booking URL */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Link2 className="h-4 w-4" />
                Appointment Booking URL
              </label>
              <Input
                value={settings.booking_url || ''}
                onChange={(e) => setSettings({ ...settings, booking_url: e.target.value })}
                placeholder="https://calendly.com/your-clinic"
              />
              <p className="text-xs text-gray-500">
                Link to your clinic&apos;s appointment booking system (e.g., Calendly, Acuity).
              </p>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              isLoading={isSaving}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-4">
                {settings.logo_url ? (
                  <NextImage
                    src={settings.logo_url}
                    alt="Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: settings.primary_color + '20' }}
                  >
                    <span style={{ color: settings.primary_color }}>♥</span>
                  </div>
                )}
                <span className="font-bold text-lg">{settings.app_name}</span>
              </div>
              <button 
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: settings.primary_color }}
              >
                Sample Button
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
