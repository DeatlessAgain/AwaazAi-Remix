import React, { useState, useEffect } from 'react';
import {
  Cloud,
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  Laptop,
  Key,
  Database,
  X,
  AlertCircle,
  Sparkles,
  Radio,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { GeneratedAudioItem, UILanguage } from '../types';
import {
  getStoredSyncKey,
  setStoredSyncKey,
  generateRandomSyncKey,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  getLastSyncedAt,
  synchronizeLibrary,
  pullCloudLibrary,
  SyncResult,
} from '../services/cloudSyncService';
import {
  getActiveFirebaseConfig,
  saveActiveFirebaseConfig,
  FirebaseCustomConfig,
} from '../services/firebaseConfig';
import { formatSeconds } from '../utils/audioHelper';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLanguage: UILanguage;
  localLibrary: GeneratedAudioItem[];
  onLibraryUpdated: (items: GeneratedAudioItem[]) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  uiLanguage,
  localLibrary,
  onLibraryUpdated,
}) => {
  const [syncKey, setSyncKey] = useState<string>(() => getStoredSyncKey());
  const [copied, setCopied] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(() => isAutoSyncEnabled());
  const [lastSynced, setLastSynced] = useState<string | null>(() => getLastSyncedAt());
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Custom Firebase configuration drawer
  const [showFirebaseConfig, setShowFirebaseConfig] = useState<boolean>(false);
  const [firebaseApiKey, setFirebaseApiKey] = useState<string>('');
  const [firebaseProjectId, setFirebaseProjectId] = useState<string>('');
  const [firebaseAppId, setFirebaseAppId] = useState<string>('');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSyncKey(getStoredSyncKey());
      setLastSynced(getLastSyncedAt());
      setAutoSync(isAutoSyncEnabled());

      const fb = getActiveFirebaseConfig();
      if (fb) {
        setFirebaseApiKey(fb.apiKey);
        setFirebaseProjectId(fb.projectId);
        setFirebaseAppId(fb.appId);
        setIsFirebaseConnected(true);
      } else {
        setIsFirebaseConnected(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    try {
      navigator.clipboard.writeText(syncKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleGenerateNewKey = () => {
    const newKey = generateRandomSyncKey();
    setSyncKey(newKey);
    setStoredSyncKey(newKey);
    setSyncStatusMsg({
      type: 'info',
      text: uiLanguage === 'urdu'
        ? 'نئی کلاؤڈ سنک کی تیار ہو گئی ہے۔'
        : 'Generated new Sync Key.',
    });
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const result: SyncResult = await synchronizeLibrary(localLibrary, syncKey);
      if (result.success) {
        onLibraryUpdated(result.items);
        setLastSynced(result.lastSyncedAt);
        const sourceLabel = result.source === 'firebase' ? 'Firebase Firestore' : 'Cloud Sync Server';
        setSyncStatusMsg({
          type: 'success',
          text: uiLanguage === 'urdu'
            ? `کامیابی سے سنک ہو گیا! کل ${result.items.length} آڈیوز محفوظ ہیں (${sourceLabel})۔`
            : `Synced successfully via ${sourceLabel}! Total ${result.items.length} audios are ready.`,
        });
      } else {
        setSyncStatusMsg({
          type: 'error',
          text: result.error || (uiLanguage === 'urdu' ? 'سنک کرنے میں خرابی پیش آئی۔' : 'Failed to synchronize.'),
        });
      }
    } catch (e: any) {
      setSyncStatusMsg({
        type: 'error',
        text: e.message || 'Unexpected synchronization error.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputKey.trim().toUpperCase();
    if (!clean || clean.length < 3) {
      setSyncStatusMsg({
        type: 'error',
        text: uiLanguage === 'urdu' ? 'براہ کرم درست سنک کی درج کریں۔' : 'Please enter a valid Sync Key.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      setStoredSyncKey(clean);
      setSyncKey(clean);
      const result = await synchronizeLibrary(localLibrary, clean);
      if (result.success) {
        onLibraryUpdated(result.items);
        setLastSynced(result.lastSyncedAt);
        setInputKey('');
        setSyncStatusMsg({
          type: 'success',
          text: uiLanguage === 'urdu'
            ? `دوسرے ڈیوائس سے کامیابی سے جڑ گیا! ${result.items.length} آڈیوز لوڈ ہو گئیں۔`
            : `Connected to other device! Loaded ${result.items.length} audio recordings.`,
        });
      } else {
        setSyncStatusMsg({
          type: 'error',
          text: result.error || 'Failed to connect to specified sync key.',
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err.message || 'Connection error.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = () => {
    const next = !autoSync;
    setAutoSync(next);
    setAutoSyncEnabled(next);
  };

  const handleSaveFirebaseConfig = () => {
    if (firebaseApiKey.trim() && firebaseProjectId.trim()) {
      const cfg: FirebaseCustomConfig = {
        apiKey: firebaseApiKey.trim(),
        projectId: firebaseProjectId.trim(),
        appId: firebaseAppId.trim() || '1:123456789:web:awaaz',
        authDomain: `${firebaseProjectId.trim()}.firebaseapp.com`,
      };
      saveActiveFirebaseConfig(cfg);
      setIsFirebaseConnected(true);
      setSyncStatusMsg({
        type: 'success',
        text: uiLanguage === 'urdu'
          ? 'فائر بیس فائر اسٹور کنفیگریشن محفوظ کر لی گئی۔'
          : 'Firebase Firestore custom configuration saved successfully.',
      });
    } else {
      saveActiveFirebaseConfig(null);
      setIsFirebaseConnected(false);
      setSyncStatusMsg({
        type: 'info',
        text: uiLanguage === 'urdu'
          ? 'ڈیفالٹ کلاؤڈ سنک پر ری سیٹ کر دیا گیا۔'
          : 'Reset to default Cloud Sync engine.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#0b0c13] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span className={uiLanguage === 'urdu' ? 'font-urdu' : ''}>
                    {uiLanguage === 'urdu' ? 'کلاؤڈ سنکرونائزیشن (Cross-Device)' : 'Firebase & Cloud Audio Sync'}
                  </span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  Live Sync
                </span>
              </div>
              <p className={`text-xs text-white/50 ${uiLanguage === 'urdu' ? 'font-urdu' : ''}`}>
                {uiLanguage === 'urdu'
                  ? 'تمام ڈیوائسز (موبائل، ٹیبلٹ اور لیپ ٹاپ) پر اپنا آڈیو کتب خانہ محفوظ اور سنک رکھیں'
                  : 'Sync your saved voiceovers, Naats, poetry and audio across phones, tablets & laptops'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          {/* Status Message */}
          {syncStatusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                syncStatusMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : syncStatusMsg.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}
            >
              {syncStatusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="flex-1 font-medium">{syncStatusMsg.text}</span>
            </div>
          )}

          {/* Section 1: Your Device Sync Key */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span className={uiLanguage === 'urdu' ? 'font-urdu' : ''}>
                  {uiLanguage === 'urdu' ? 'آپ کا پرسنل سنک کوڈ (Personal Sync Key)' : 'Your Cloud Sync Key'}
                </span>
              </label>
              <button
                type="button"
                onClick={handleGenerateNewKey}
                className="text-[11px] text-white/40 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {uiLanguage === 'urdu' ? 'نیا کوڈ بنائیں' : 'Generate New'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm font-mono text-indigo-300 tracking-wider font-bold select-all flex items-center justify-between">
                <span>{syncKey}</span>
                <span className="text-[10px] text-emerald-400 font-sans font-normal px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {localLibrary.length} {uiLanguage === 'urdu' ? 'آڈیوز' : 'items'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyKey}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (uiLanguage === 'urdu' ? 'کاپی ہوگیا' : 'Copied!') : (uiLanguage === 'urdu' ? 'کاپی' : 'Copy')}</span>
              </button>
            </div>

            <p className={`text-[11px] text-white/40 leading-relaxed ${uiLanguage === 'urdu' ? 'font-urdu' : ''}`}>
              {uiLanguage === 'urdu'
                ? 'یہ کوڈ اپنے موبائل فون، اینڈرائیڈ ایپ یا دوسرے کمپیوٹر پر درج کریں تاکہ سبھی آڈیوز خود بخود منتقل اور اپڈیٹ ہو جائیں۔'
                : 'Enter this Sync Key on your phone, Android app, or tablet to access and synchronize your library instantly.'}
            </p>
          </div>

          {/* Section 2: Sync Action Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sync Now Button */}
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/20 disabled:opacity-50 active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-white' : ''}`} />
              <span className={uiLanguage === 'urdu' ? 'font-urdu' : ''}>
                {isSyncing
                  ? uiLanguage === 'urdu' ? 'سنک ہو رہا ہے...' : 'Syncing Library...'
                  : uiLanguage === 'urdu' ? 'ابھی سنک کریں (Sync Now)' : 'Sync Library Now'}
              </span>
            </button>

            {/* Auto-Sync Toggle */}
            <div
              onClick={handleToggleAutoSync}
              className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between select-none"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white/90">
                  {uiLanguage === 'urdu' ? 'خودکار سنک (Auto-Sync)' : 'Real-time Auto-Sync'}
                </span>
                <span className="text-[10px] text-white/40">
                  {uiLanguage === 'urdu' ? 'نئی آڈیو بنتے ہی خود بخود محفوظ ہو' : 'Sync on new voiceover'}
                </span>
              </div>
              <div
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                  autoSync ? 'bg-indigo-600' : 'bg-white/15'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    autoSync ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pair / Connect from Another Device */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className={uiLanguage === 'urdu' ? 'font-urdu' : ''}>
                {uiLanguage === 'urdu' ? 'دوسرے ڈیوائس کا سنک کوڈ درج کریں' : 'Connect to another device'}
              </span>
            </label>

            <form onSubmit={handleConnectDevice} className="flex items-center gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="e.g. AWAAZ-7824-3910"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                type="submit"
                disabled={isSyncing || !inputKey.trim()}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
              >
                {uiLanguage === 'urdu' ? 'جوڑیں (Connect)' : 'Connect & Pull'}
              </button>
            </form>
          </div>

          {/* Section 4: Advanced Firebase Settings (Collapsible) */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFirebaseConfig(!showFirebaseConfig)}
              className="w-full px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex items-center justify-between text-xs font-semibold text-white/70 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Custom Firebase Firestore Configuration</span>
                {isFirebaseConnected && (
                  <span className="px-2 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-mono">
                    Active
                  </span>
                )}
              </div>
              <Sliders className="w-3.5 h-3.5 text-white/40" />
            </button>

            {showFirebaseConfig && (
              <div className="p-4 bg-black/30 space-y-3 border-t border-white/10 text-xs">
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Awaaz AI includes instant cross-device cloud sync automatically. If you also have your own Google Firebase project, you can provide its credentials below for private Firestore persistence:
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-white/60 block mb-1">Firebase Project ID</label>
                    <input
                      type="text"
                      value={firebaseProjectId}
                      onChange={(e) => setFirebaseProjectId(e.target.value)}
                      placeholder="e.g. awaaz-ai-studio"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/60 block mb-1">Firebase API Key</label>
                    <input
                      type="password"
                      value={firebaseApiKey}
                      onChange={(e) => setFirebaseApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/60 block mb-1">Firebase App ID (Optional)</label>
                    <input
                      type="text"
                      value={firebaseAppId}
                      onChange={(e) => setFirebaseAppId(e.target.value)}
                      placeholder="1:123456789:web:abcdef"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFirebaseApiKey('');
                      setFirebaseProjectId('');
                      setFirebaseAppId('');
                      saveActiveFirebaseConfig(null);
                      setIsFirebaseConnected(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs transition-colors cursor-pointer"
                  >
                    Reset to Default
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFirebaseConfig}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Save Credentials
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Last Synced indicator */}
          <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
            <span className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-white/30" />
              <span>Current Device: {localLibrary.length} audio files locally</span>
            </span>
            <span>
              {lastSynced
                ? `Last synced: ${new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Never synced'}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer"
          >
            {uiLanguage === 'urdu' ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
