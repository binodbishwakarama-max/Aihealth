'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, Clock, Users, CheckCircle, ArrowRight, Heart, Stethoscope, Brain, Zap, Shield, MessageCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  AnimatedHero,
  AnimatedText,
  AnimatedCounter,
  GlowCard,
  MagneticButton,
  TiltCard
} from '@/components/animations';
import { useLanguage } from '@/lib/i18n';

export default function HomePageClient() {
  const { t } = useLanguage();

  return (
    <div className="bg-white overflow-hidden">
      {/* Animated Hero Section */}
      <AnimatedHero>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <AnimatedText delay={0}>
                <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Heart className="h-4 w-4 text-teal-600" />
                  </motion.div>
                  {t.home.badge}
                </div>
              </AnimatedText>

              <AnimatedText delay={0.2}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  {t.home.heroTitle}{' '}
                  <span className="relative">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500">
                      {t.home.heroHighlight}
                    </span>
                    <motion.span
                      className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: 0.8 }}
                    />
                  </span>{' '}
                  {t.home.heroTitleEnd}
                </h1>
              </AnimatedText>

              <AnimatedText delay={0.4}>
                <p className="text-lg text-gray-600 mb-8 max-w-lg">
                  {t.home.heroDescription}
                </p>
              </AnimatedText>

              <AnimatedText delay={0.6}>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <MagneticButton>
                    <Link href="/checker">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all">
                          <Zap className="mr-2 h-5 w-5" />
                          {t.home.checkSymptoms}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </motion.div>
                    </Link>
                  </MagneticButton>
                  <MagneticButton>
                    <Link href="/vision">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all text-white">
                          <Camera className="mr-2 h-5 w-5" />
                          Visual Scan
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </motion.div>
                    </Link>
                  </MagneticButton>
                  <MagneticButton>
                    <Link href="/about">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                          {t.home.learnMore}
                        </Button>
                      </motion.div>
                    </Link>
                  </MagneticButton>
                </div>
              </AnimatedText>

              <AnimatedText delay={0.8}>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <motion.div
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.1, color: '#0d9488' }}
                  >
                    <CheckCircle className="h-4 w-4 text-teal-500" />
                    {t.home.freeToUse}
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-2"
                    whileHover={{ scale: 1.1, color: '#0d9488' }}
                  >
                    <CheckCircle className="h-4 w-4 text-teal-500" />
                    {t.home.noRegistration}
                  </motion.div>
                </div>
              </AnimatedText>
            </div>

            {/* Animated Feature Cards */}
            <div className="relative hidden lg:block">
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-3xl blur-3xl opacity-20"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div className="relative space-y-4">
                {[
                  { icon: Heart, color: 'from-rose-500 to-orange-500', title: t.home.featureAnalysis, desc: t.home.featureAnalysisDesc, delay: 0.2 },
                  { icon: Stethoscope, color: 'from-teal-500 to-emerald-500', title: t.home.featureSelfCare, desc: t.home.featureSelfCareDesc, delay: 0.4 },
                  { icon: Brain, color: 'from-cyan-500 to-teal-500', title: t.home.featureEducation, desc: t.home.featureEducationDesc, delay: 0.6 },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + item.delay, duration: 0.6 }}
                  >
                    <TiltCard className="cursor-pointer">
                      <GlowCard className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                          <motion.div
                            className={`p-3 rounded-xl bg-gradient-to-br ${item.color}`}
                            whileHover={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.5 }}
                          >
                            <item.icon className="h-6 w-6 text-white" />
                          </motion.div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                        </div>
                      </GlowCard>
                    </TiltCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedHero>

      {/* Animated Stats Section */}
      <section className="py-16 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 500, suffix: '+', label: t.home.statsChecks },
              { value: 95, suffix: '%', label: t.home.statsConditions },
              { value: 24, suffix: '/7', label: t.home.statsAvailability },
              { value: 200, suffix: '+', label: t.home.statsSatisfaction },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center text-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-teal-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.home.whyTitle}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t.home.whyDesc}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { icon: Activity, color: 'teal', title: t.home.whySymptomEd, desc: t.home.whySymptomEdDesc },
              { icon: MessageCircle, color: 'purple', title: t.home.whyAiChat, desc: t.home.whyAiChatDesc },
              { icon: Shield, color: 'emerald', title: t.home.whyRisk, desc: t.home.whyRiskDesc },
              { icon: Clock, color: 'orange', title: t.home.whySeekCare, desc: t.home.whySeekCareDesc },
              { icon: Users, color: 'cyan', title: t.home.whySelfCare, desc: t.home.whySelfCareDesc },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <TiltCard>
                  <GlowCard
                    className="h-full p-5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300"
                    glowColor={
                      feature.color === 'teal' ? 'rgba(13, 148, 136, 0.3)' :
                        feature.color === 'emerald' ? 'rgba(16, 185, 129, 0.3)' :
                          feature.color === 'orange' ? 'rgba(249, 115, 22, 0.3)' :
                            feature.color === 'purple' ? 'rgba(147, 51, 234, 0.3)' :
                              'rgba(6, 182, 212, 0.3)'
                    }
                  >
                    <motion.div
                      className={`inline-flex p-3 rounded-lg mb-4 ${feature.color === 'teal' ? 'bg-teal-100 text-teal-600' :
                        feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                          feature.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                            feature.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                              'bg-cyan-100 text-cyan-600'
                        }`}
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="h-6 w-6" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                  </GlowCard>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.home.howItWorks}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get helpful health education in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: t.home.step1Title, desc: t.home.step1Desc },
              { num: '02', title: t.home.step2Title, desc: t.home.step2Desc },
              { num: '03', title: t.home.step3Title, desc: t.home.step3Desc },
            ].map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <GlowCard className="bg-white rounded-xl p-8 border border-gray-100 hover:shadow-lg transition-all duration-300">
                  <motion.div
                    className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-200 mb-4"
                    whileHover={{ scale: 1.1 }}
                  >
                    {step.num}
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </GlowCard>
                {index < 2 && (
                  <motion.div
                    className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2"
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-8 w-8 text-gray-300" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <MagneticButton>
              <Link href="/checker">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="shadow-lg shadow-teal-500/25 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600">
                    {t.home.checkSymptoms}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600" />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Learn About Your Health?
            </h2>
            <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">
              Get instant AI-powered educational guidance about your symptoms.
              It&apos;s free, confidential, and takes less than 2 minutes.
            </p>
            <MagneticButton>
              <Link href="/checker">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-white text-teal-600 hover:bg-gray-100 shadow-xl"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    {t.home.checkSymptoms}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </MagneticButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
