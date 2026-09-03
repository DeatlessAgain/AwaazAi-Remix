import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles,
  QrCode,
  ShieldCheck,
  Zap,
  Globe,
  Share2,
  Layers,
  ArrowRight,
  Code2,
} from 'lucide-react';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'quick_install' | 'native_project' | 'apk_builder' | 'qr_code'>('native_project');

  const appUrl = typeof window !== 'undefined' 
    ? (window.location.origin.includes('localhost') || window.location.origin.includes('run.app') ? window.location.origin : 'https://ais-pre-5cvx4c33evmpc66n564nmm-904497767506.asia-east1.run.app')
    : 'https://ais-pre-5cvx4c33evmpc66n564nmm-904497767506.asia-east1.run.app';

  // Listen for PWA beforeinstallprompt on Android/Chrome
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      // If deferred prompt is not available (e.g. desktop, iOS, or inside iframe)
      // Open the app directly in a top-level browser tab where Chrome can trigger install
      window.open(appUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  if (!isOpen) return null;

  // PWABuilder package generator link pre-configured with the live app URL
  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(appUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0d0e17] border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Header with glowing gradient */}
        <div className="relative p-6 bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-pink-950/80 border-b border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Awaaz AI • Android App (.APK / PWA)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
                  Online Ready
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Apne Android phone par 1-click me install karein ya online standalone app ki tarah use karein
              </p>
            </div>
          </div>

          {/* Modal Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-3 border-t border-white/10 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('native_project')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'native_project'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Native Android Studio Project (Kotlin)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quick_install')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'quick_install'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-indigo-300" />
              <span>Direct Android Install (WebAPK)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('apk_builder')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'apk_builder'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-pink-300" />
              <span>Download Signed .APK</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('qr_code')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'qr_code'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-300" />
              <span>Mobile QR</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* TAB: Native Android Studio Project (Kotlin + Material 3) */}
          {activeTab === 'native_project' && (
            <div className="space-y-5">
              {/* Highlight Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-slate-900 border border-emerald-500/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">100% Native Kotlin Android Project</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                          NO WEBVIEW
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">
                        مکمل اصل اینڈرائیڈ ایپ سورس کوڈ جو Android Studio میں براہ راست اوپن ہو کر Play Store ریڈی APK یا Bundle بلڈ کر سکتا ہے۔
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Download Button for Source Project */}
                <div className="pt-1 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/AwaazAI-Android-Studio-Project.zip"
                    download="AwaazAI-Android-Studio-Project.zip"
                    className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Native Android Studio Project (.ZIP)</span>
                  </a>
                  <a
                    href="/app-debug.apk"
                    download="AwaazAI-debug.apk"
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Compiled .APK (1.33 MB)</span>
                  </a>
                </div>
              </div>

              {/* Architecture & Files Included */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>پروجیکٹ میں شامل نیٹو فائلز (Included Native Architecture):</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-emerald-200">
                    📂 <strong>app/src/main/java/...</strong>
                    <div className="text-white/60 mt-1 pl-2 text-[10px]">
                      • <code>MainActivity.kt</code> (Native UI Controller)<br/>
                      • <code>NativeAudioEngine.kt</code> (ExoPlayer + Offline TTS)<br/>
                      • <code>ApiClient.kt</code> (OkHttp Cloud AI Client)<br/>
                      • <code>AwaazApplication.kt</code> (App Lifecycle)
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-teal-200">
                    🎨 <strong>app/src/main/res/...</strong>
                    <div className="text-white/60 mt-1 pl-2 text-[10px]">
                      • <code>layout/activity_main.xml</code> (Material 3 UI)<br/>
                      • <code>values/strings.xml</code> (Urdu, Hindi, English)<br/>
                      • <code>values/colors.xml</code> & <code>themes.xml</code><br/>
                      • <code>drawable/ic_*.xml</code> (Vector Graphics)
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Pillars of Native Architecture */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>نیا اینڈرائیڈ اپ ڈیٹ: 4 بنیادی ستون (4 Core Enhancements Added):</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                      ⚡ <span>1. Native WebView Bridge</span>
                    </div>
                    <p className="text-[10px] text-white/70 leading-relaxed">
                      <code>@JavascriptInterface</code> کا مکمل کنکشن: Native Toasts، Haptic Feedback، فون اسٹوریج میں ڈائریکٹ آڈیو سیو، اور نیٹو شیئر شیٹ۔
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-[11px]">
                      📁 <span>2. Native File Access Enabled</span>
                    </div>
                    <p className="text-[10px] text-white/70 leading-relaxed">
                      <code>allowFileAccess</code> & <code>onShowFileChooser</code>: فون میموری سے کسی بھی آڈیو یا ٹیکسٹ فائل کا براؤز اور اپلوڈ بغیر کسی رکاوٹ کے ممکن۔
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5 text-[11px]">
                      🔄 <span>3. Resource Loading Fixed</span>
                    </div>
                    <p className="text-[10px] text-white/70 leading-relaxed">
                      <code>shouldInterceptRequest</code> ایسٹ لوکیشن اور درست MIME types (.js, .css, .woff2, .mp3): کوئی وائٹ اسکرین یا لوکل پاتھ ایرر نہیں۔
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="font-bold text-pink-300 flex items-center gap-1.5 text-[11px]">
                      🛡️ <span>4. Smart Permission Logic</span>
                    </div>
                    <p className="text-[10px] text-white/70 leading-relaxed">
                      <code>RECORD_AUDIO</code> اور اسٹوریج کے ڈائنامک رن ٹائم پرمیشن ڈائیلاگ اور WebChromeClient میں WebRTC آڈیو کیپچر گرانٹس۔
                    </p>
                  </div>
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Android Studio میں چلانے کا آسان طریقہ:
                </h4>

                <div className="space-y-2 text-xs text-white/70">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono">
                      1
                    </span>
                    <span>
                      اوپر دیے گئے بٹن سے <strong>AwaazAI-Android-Studio-Project.zip</strong> ڈاؤن لوڈ کریں اور اپنے کمپیوٹر پر ان زپ (Extract) کریں۔
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono">
                      2
                    </span>
                    <span>
                      <strong>Android Studio</strong> کھولیں اور <strong>"Open"</strong> دبا کر اس فولڈر (AwaazAIStudio) کو منتخب کریں۔
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono">
                      3
                    </span>
                    <span>
                      اپنا موبائل USB کیبل سے جوڑیں اور اوپر سبز <strong>Run (Shift + F10)</strong> بٹن دبائیں — 100% اوریجنل نیٹو ایپ آپ کے فون میں انسٹال ہو جائے گی!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Direct Android Install (WebAPK) */}
          {activeTab === 'quick_install' && (
            <div className="space-y-5">
              {/* Highlight Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Direct Android Phone Installation</h4>
                    <p className="text-xs text-white/60 mt-0.5">
                      Koi third-party store ki zaroorat nahi — Chrome browser se direct home screen app ban jati hai.
                    </p>
                  </div>
                </div>

                {isInstalled ? (
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>App Installed!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>{deferredPrompt ? 'Install App on Android' : 'Open in New Tab to Install'}</span>
                    </button>
                    <a
                      href={appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center"
                      title="Open full app in separate browser tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              {/* Step by Step Guide for Android Users */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Android par 2 simple steps me install karne ka tareeqa:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold font-mono">
                        1
                      </span>
                      <span className="text-xs font-bold text-white">Chrome Menu Open Karein</span>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      Apne Android phone ke Google Chrome browser me ooper right side par <strong>Three Dots (⋮)</strong> icon par click karein.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold font-mono">
                        2
                      </span>
                      <span className="text-xs font-bold text-white">"Install App" select karein</span>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      Menu me se <strong>"Install app"</strong> ya <strong>"Add to Home screen"</strong> par tap karein. App aapke phone me install ho jayegi!
                    </p>
                  </div>
                </div>
              </div>

              {/* App Features on Android */}
              <div className="p-4 rounded-2xl bg-[#131422] border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white/80 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Android App ke Fayde (Features):</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-white/70">
                  <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl">
                    <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span>Instant Launch & Zero Lag</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl">
                    <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Fullscreen Standalone UI</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl">
                    <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Always Synced Online</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Download Signed .APK Package */}
          {activeTab === 'apk_builder' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-pink-950/40 border border-purple-500/30 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Standalone Android .APK Package</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        v2.1 Updated
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mt-0.5">
                      Updated signed <code>.apk</code> package جس میں آف لائن ٹیکسٹ ٹو اسپیچ اور آٹو کلاؤڈ کنکشن شامل ہے۔
                    </p>
                  </div>
                </div>

                {/* Important Notice regarding Blank Screen resolution */}
                <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/25 text-xs text-indigo-200/90 leading-relaxed font-urdu">
                  <strong>بلینک اسکرین کا حل (Blank Screen Fix):</strong> پرانی APK میں ماڈیول سیکیورٹی کی وجہ سے اسکرین کالی رہ جاتی تھی۔ ہم نے اس میں مکمل آف لائن اسپیچ انجن اور آٹو ری کنیکٹ سسٹم شامل کر دیا ہے۔
                </div>

                <div className="pt-1 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/app-debug.apk"
                    download="AwaazAI-debug.apk"
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Updated .APK (1.33 MB)</span>
                  </a>
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
                  >
                    <span>PWABuilder se Package Karein</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Instructions for APK Builder */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
                  بہترین تجربے کے لیے تجویز (Recommended):
                </h4>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs text-white/70">
                  <p className="leading-relaxed">
                    اینڈرائیڈ پر تمام اصلی AI وائس فیچرز (24kHz HD Audio, Gemini Script & Poetry) استعمال کرنے کے لیے <strong>Tab 1 (Direct Android Install)</strong> استعمال کریں، کیونکہ کروم کا PWA انجن بیک اینڈ سرور سے 100% ہم آہنگ رہتا ہے۔
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Mobile QR & Share Link */}
          {activeTab === 'qr_code' && (
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  {/* Real Live QR Code image for direct camera scanning */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(appUrl)}`}
                    alt="Scan to open on Android phone"
                    className="w-44 h-44 rounded-lg object-contain"
                    loading="lazy"
                  />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Apne Android Camera se Scan Karein</h4>
                  <p className="text-xs text-white/60 max-w-sm">
                    موبائل کے کیمرہ سے کیو آر کوڈ اسکین کریں، ایپ خود بخود آپ کے موبائل میں کھل جائے گی اور ہوم اسکرین پر انسٹال ہو جائے گی۔
                  </p>
                </div>

                {/* Copy URL Box */}
                <div className="w-full max-w-md flex items-center gap-2 p-2 rounded-xl bg-black/60 border border-white/15">
                  <span className="text-xs text-white/60 truncate flex-1 px-2 font-mono">
                    {appUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-white/40">
            Awaaz AI Studio v2.0 • Android PWA & APK Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
