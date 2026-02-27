'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, Loader2, Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import ReactMarkdown from 'react-markdown';

export default function VisionPage() {
    const { t, languageName } = useLanguage();
    const [image, setImage] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>('');
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file (JPEG, PNG, etc).');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('Image is too large. Please keep it under 5MB.');
                return;
            }

            setError(null);
            setMimeType(file.type);
            setAnalysis(null);

            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!image) return;

        setIsAnalyzing(true);
        setError(null);
        setAnalysis(null);

        try {
            const response = await fetch('/api/analyze-vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image,
                    mimeType,
                    language: languageName,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze image');
            }

            setAnalysis(data.analysis);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred during specific visual analysis.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearImage = () => {
        setImage(null);
        setAnalysis(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center justify-center p-3 sm:p-4 bg-teal-100/50 rounded-full mb-2 ring-1 ring-teal-200"
                    >
                        <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600" />
                    </motion.div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                        Visual Symptom <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">Scanner</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        Upload a secure photo of a skin condition, rash, or visible symptom, and our AI vision engine will educate you on possible causes.
                    </p>

                    <div className="flex items-center justify-center gap-2 mt-4 text-xs font-semibold px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full inline-flex mx-auto border border-yellow-200">
                        <AlertTriangle className="w-4 h-4" />
                        Not a substitute for professional medical diagnosis. Privacy strictly preserved.
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

                    {/* Upload & Preview */}
                    <div className="md:col-span-5 w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        {!image ? (
                            <div
                                className="border-2 border-dashed border-gray-200 rounded-2xl h-80 flex flex-col items-center justify-center text-center p-6 hover:bg-gray-50 hover:border-teal-300 transition-colors cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <ImagePlus className="w-8 h-8 text-teal-600" />
                                </div>
                                <h3 className="text-gray-900 font-medium text-lg mb-1">Upload a clear photo</h3>
                                <p className="text-sm text-gray-400">JPEG, PNG, WEBP max 5MB</p>
                                <button className="mt-6 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm focus:ring-2 focus:ring-gray-900 focus:ring-offset-2">
                                    Browse Files
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-[4/5] flex items-center justify-center shadow-inner">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={image}
                                        alt="Symptom Preview"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={clearImage}
                                        disabled={isAnalyzing}
                                        className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Reselect
                                    </button>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing || !!analysis}
                                        className="flex-[2] px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-emerald-600 shadow-md flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Scanning...
                                            </>
                                        ) : analysis ? (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                                Analyzed
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 mr-2" />
                                                Analyze Photo
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-red-50 text-red-700 text-sm font-medium border border-red-100 rounded-xl flex items-start gap-3"
                            >
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p>{error}</p>
                            </motion.div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Results Analysis */}
                    <div className="md:col-span-7">
                        <AnimatePresence mode="wait">
                            {isAnalyzing && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-6"
                                >
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full border-4 border-gray-100 animate-pulse"></div>
                                        <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-teal-500 border-r-emerald-500 animate-[spin_1.5s_linear_infinite] absolute inset-0"></div>
                                        <Sparkles className="w-8 h-8 text-teal-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Image Patterns</h3>
                                        <p className="text-gray-500">Our Vision AI is comparing your image against vast medical datasets for educational insights...</p>
                                    </div>
                                </motion.div>
                            )}

                            {analysis && !isAnalyzing && (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-3xl shadow-lg border border-teal-100 overflow-hidden"
                                >
                                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 p-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-teal-900 flex items-center gap-2">
                                                <CheckCircle2 className="w-6 h-6 text-teal-500" />
                                                Analysis Complete
                                            </h3>
                                            <p className="text-sm text-teal-700 mt-1">Review the AI observations below</p>
                                        </div>
                                    </div>

                                    <div className="p-6 md:p-8 prose prose-teal prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 max-w-none prose-a:text-teal-600">
                                        <ReactMarkdown>{analysis}</ReactMarkdown>
                                    </div>

                                    <div className="bg-gray-50 p-6 border-t border-gray-100 mt-4 rounded-b-3xl">
                                        <p className="text-xs text-gray-500 flex items-start gap-2 text-justify">
                                            <Info className="w-4 h-4 shrink-0 text-gray-400 mt-0.5" />
                                            This output is strictly generated by AI models for educational assistance and does not represent an actual clinical diagnosis. Please seek live medical attention if you believe you are suffering an emergency.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {!analysis && !isAnalyzing && (
                                <div className="bg-white/50 border border-dashed border-gray-200 rounded-3xl h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-gray-400">
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                        <Sparkles className="w-7 h-7 text-gray-300" />
                                    </div>
                                    <p>Upload a photo on the left to see rapid AI insights here.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
