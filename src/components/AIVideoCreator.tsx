import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Download,
  Play,
  Pause,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Layers,
  Palette,
  Type,
  Volume2,
  Film,
  Maximize2,
  RotateCcw,
  Wand2,
  Camera,
  Upload,
  Clapperboard,
  Music,
  ArrowRight,
  AlertCircle,
  Eye,
  Trash2,
  MonitorPlay,
  Flame,
} from 'lucide-react';
import {
  GeneratedAudioItem,
  SubtitleCue,
  VideoAspectRatio,
  VideoStudioMode,
  CameraMotionType,
  VideoStoryScene,
  GeneratedAIVideoItem,
  VideoEngineModel,
} from '../types';
import {
  VIDEO_ENGINE_MODELS,
  SCENIC_STOCK_SCENES,
  VIDEO_PROMPT_PRESETS,
  ScenicStockScene,
} from '../data/videoScenesData';

interface AIVideoCreatorProps {
  activeAudioItem: GeneratedAudioItem | null;
  initialCues?: SubtitleCue[];
}

export const AIVideoCreator: React.FC<AIVideoCreatorProps> = ({
  activeAudioItem,
  initialCues = [],
}) => {
  // Video Engine Model: Pollinations FLUX (Free), 4K Scenic (Free), Audio Visualizer (Free), or Veo 3.1
  const [selectedModel, setSelectedModel] = useState<VideoEngineModel>('pollinations_flux');
  const [selectedScenicScene, setSelectedScenicScene] = useState<ScenicStockScene>(SCENIC_STOCK_SCENES[0]);
  const [scenicCategoryFilter, setScenicCategoryFilter] = useState<'all' | 'islamic' | 'spiritual' | 'nature' | 'ambience'>('all');
  const [isGeneratingFreeVideo, setIsGeneratingFreeVideo] = useState<boolean>(false);
  const [freeVideoStatusMessage, setFreeVideoStatusMessage] = useState<string>('');
  const [veoQuotaError, setVeoQuotaError] = useState<boolean>(false);

  // Main Studio Mode Tabs: Text to Video | Image to Video | Audio to Video
  const [videoMode, setVideoMode] = useState<VideoStudioMode>('text_to_video');

  // Shared / Common States
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [videoGallery, setVideoGallery] = useState<GeneratedAIVideoItem[]>([]);
  const [selectedGalleryVideo, setSelectedGalleryVideo] = useState<GeneratedAIVideoItem | null>(null);

  // ----------------------------------------------------
  // Mode 1: Text to Video (T2V) State
  // ----------------------------------------------------
  const [t2vPrompt, setT2vPrompt] = useState<string>(
    'Badshahi Mosque in Lahore at golden sunset with flying pigeons, cinematic 4k drone shot'
  );
  const [t2vStyle, setT2vStyle] = useState<string>('cinematic');
  const [t2vCameraMotion, setT2vCameraMotion] = useState<CameraMotionType>('drone_sweep');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [enhancedPromptNotes, setEnhancedPromptNotes] = useState<string | null>(null);
  
  // Veo Generation States
  const [isGeneratingVeoVideo, setIsGeneratingVeoVideo] = useState<boolean>(false);
  const [veoOperationName, setVeoOperationName] = useState<string | null>(null);
  const [veoStatusMessage, setVeoStatusMessage] = useState<string>('');
  const [veoError, setVeoError] = useState<string | null>(null);
  const [veoPollTimer, setVeoPollTimer] = useState<number>(0);

  // Multi-Scene Storyboard State
  const [storyboardScenes, setStoryboardScenes] = useState<VideoStoryScene[]>([]);
  const [isBuildingStoryboard, setIsBuildingStoryboard] = useState<boolean>(false);

  // ----------------------------------------------------
  // Mode 2: Image to Video (I2V) State
  // ----------------------------------------------------
  const [i2vSourceImage, setI2vSourceImage] = useState<string | null>(null);
  const [i2vMotionPrompt, setI2vMotionPrompt] = useState<string>(
    'Cinematic living portrait with soft wind flowing through hair and gentle ambient depth lighting'
  );
  const [i2vMotionStyle, setI2vMotionStyle] = useState<'living_portrait' | 'zoom_parallax' | 'pan_sweep' | 'ambient_particles'>('living_portrait');
  const [i2vParticleEffect, setI2vParticleEffect] = useState<'none' | 'rain' | 'snow' | 'gold_embers' | 'rose_petals'>('gold_embers');
  const [aiImagePrompt, setAiImagePrompt] = useState<string>('Majestic Mughal palace courtyards with fountains and golden morning sunlight');
  const [isGeneratingBaseImage, setIsGeneratingBaseImage] = useState<boolean>(false);

  // ----------------------------------------------------
  // Mode 3: Audio to Video (A2V) & Canvas Visualizer State
  // ----------------------------------------------------
  const [waveformStyle, setWaveformStyle] = useState<'neon_bars' | 'circular_radial' | 'frequency_wave' | 'glowing_particles'>('neon_bars');
  const [themeGradient, setThemeGradient] = useState<string>('cyber_indigo');
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('آواز • AWAAZ AI');
  const [captionFontSize, setCaptionFontSize] = useState<number>(36);
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [isGeneratingA2vBg, setIsGeneratingA2vBg] = useState<boolean>(false);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(activeAudioItem?.durationSeconds || 6.0);
  const [cues, setCues] = useState<SubtitleCue[]>(initialCues);
  const [isRenderingVideo, setIsRenderingVideo] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderedVideoBlobUrl, setRenderedVideoBlobUrl] = useState<string | null>(null);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; size: number; speedY: number; speedX: number; opacity: number }>>([]);

  // Load / update cues when active audio changes
  useEffect(() => {
    if (activeAudioItem) {
      setDuration(activeAudioItem.durationSeconds || 6.0);
      if (initialCues.length > 0) {
        setCues(initialCues);
      } else {
        fetch('/api/ai/generate-subtitles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: activeAudioItem.text,
            durationSeconds: activeAudioItem.durationSeconds || 6.0,
            language: 'auto',
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.result?.cues) {
              setCues(data.result.cues);
            }
          })
          .catch(console.error);
      }
    }
  }, [activeAudioItem?.id, initialCues]);

  // Dimensions based on Aspect Ratio
  const getCanvasDimensions = () => {
    switch (aspectRatio) {
      case '9:16':
        return { width: 720, height: 1280 };
      case '16:9':
        return { width: 1280, height: 720 };
      case '1:1':
      default:
        return { width: 800, height: 800 };
    }
  };

  // Initialize Web Audio Analyzer Node
  const setupAudioContext = () => {
    if (!audioRef.current || audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
    } catch (e) {
      console.warn('Audio Context setup note:', e);
    }
  };

  // Initialize Particle System
  useEffect(() => {
    const { width, height } = getCanvasDimensions();
    const count = 45;
    const p: Array<{ x: number; y: number; size: number; speedY: number; speedX: number; opacity: number }> = [];
    for (let i = 0; i < count; i++) {
      p.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedY: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.7 + 0.3,
      });
    }
    particlesRef.current = p;
  }, [aspectRatio]);

  // Canvas Drawing Loop
  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getCanvasDimensions();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const curTime = audioRef.current ? audioRef.current.currentTime : currentTime;

    // 1. Draw Background Image or Motion Backdrop
    const activeBg =
      (selectedModel === 'scenic_stock' && selectedScenicScene ? selectedScenicScene.imageUrl : null) ||
      (videoMode === 'image_to_video' ? i2vSourceImage : customBgImage) ||
      customBgImage;
    
    if (activeBg) {
      const img = new Image();
      img.src = activeBg;
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        // Dynamic camera zoom / motion simulation
        if (isPlaying || isRenderingVideo) {
          const zoom = 1 + Math.sin(curTime * 0.4) * 0.06;
          const shiftX = Math.cos(curTime * 0.3) * 16;
          const shiftY = Math.sin(curTime * 0.25) * 8;
          ctx.translate(width / 2 + shiftX, height / 2 + shiftY);
          ctx.scale(zoom, zoom);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }
        ctx.restore();

        // Dark overlay for text/visualizer contrast
        ctx.fillStyle = videoMode === 'image_to_video' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      let grad = ctx.createLinearGradient(0, 0, width, height);
      if (themeGradient === 'cyber_indigo') {
        grad.addColorStop(0, '#0a0a1a');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#05050a');
      } else if (themeGradient === 'sunset_crimson') {
        grad.addColorStop(0, '#1c0515');
        grad.addColorStop(0.5, '#4c0519');
        grad.addColorStop(1, '#090105');
      } else if (themeGradient === 'cosmic_aurora') {
        grad.addColorStop(0, '#021a1a');
        grad.addColorStop(0.5, '#064e3b');
        grad.addColorStop(1, '#020b0b');
      } else if (themeGradient === 'amber_gold') {
        grad.addColorStop(0, '#1a1303');
        grad.addColorStop(0.5, '#451a03');
        grad.addColorStop(1, '#080501');
      } else {
        grad.addColorStop(0, '#0c0d14');
        grad.addColorStop(1, '#040407');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Animated Ambient Glow Orbs
    const t = curTime * 1.5;
    const pulse = Math.sin(t) * 20;
    const radGrad = ctx.createRadialGradient(
      width / 2 + Math.cos(t * 0.8) * 60,
      height / 2 + Math.sin(t * 0.6) * 60,
      10,
      width / 2,
      height / 2,
      width * 0.6 + pulse
    );
    radGrad.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    radGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.12)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, width, height);

    // 3. Particle System (Rain, Embers, Stardust, Petals)
    const activeParticles =
      selectedModel === 'scenic_stock' && selectedScenicScene
        ? selectedScenicScene.defaultParticles
        : videoMode === 'image_to_video'
        ? i2vParticleEffect
        : 'gold_embers';
    if (activeParticles !== 'none' && particlesRef.current.length > 0) {
      ctx.save();
      particlesRef.current.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        if (activeParticles === 'rain') {
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity * 0.7})`;
          ctx.lineWidth = 1.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.size * 6);
          ctx.stroke();
        } else if (activeParticles === 'gold_embers') {
          ctx.fillStyle = `rgba(250, 204, 21, ${p.opacity})`;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (activeParticles === 'rose_petals') {
          ctx.fillStyle = `rgba(244, 63, 94, ${p.opacity * 0.8})`;
          ctx.shadowColor = '#e11d48';
          ctx.shadowBlur = 6;
          ctx.ellipse(p.x, p.y, p.size * 2, p.size, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Snow / Stardust
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }

    // 4. Audio Frequency Waveform (Only active in Audio-to-Video mode or if audio is present)
    if (videoMode === 'audio_to_video' || (activeAudioItem && videoMode !== 'text_to_video')) {
      let freqData = new Uint8Array(64);
      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(freqData);
      } else {
        for (let i = 0; i < 64; i++) {
          freqData[i] = isPlaying
            ? Math.floor(60 + Math.sin(curTime * 8 + i * 0.3) * 40 + Math.random() * 25)
            : Math.floor(15 + Math.sin(i * 0.2) * 10);
        }
      }

      if (waveformStyle === 'neon_bars') {
        const barCount = 36;
        const barWidth = (width * 0.75) / barCount;
        const startX = (width - width * 0.75) / 2;
        const centerY = height * 0.65;

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i % freqData.length] / 255;
          const barHeight = Math.max(8, val * (height * 0.22));

          const barGrad = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
          barGrad.addColorStop(0, '#38bdf8');
          barGrad.addColorStop(0.5, '#818cf8');
          barGrad.addColorStop(1, '#c084fc');

          ctx.fillStyle = barGrad;
          ctx.shadowColor = '#6366f1';
          ctx.shadowBlur = isPlaying ? 16 : 4;

          ctx.beginPath();
          ctx.roundRect(
            startX + i * barWidth + 2,
            centerY - barHeight / 2,
            barWidth - 4,
            barHeight,
            4
          );
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (waveformStyle === 'circular_radial') {
        const centerX = width / 2;
        const centerY = height * 0.58;
        const baseRadius = width * 0.18;
        const pointCount = 48;

        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < pointCount; i++) {
          const angle = (i / pointCount) * Math.PI * 2;
          const val = freqData[i % freqData.length] / 255;
          const r = baseRadius + val * 55;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#818cf8';
        ctx.shadowBlur = 20;
        ctx.stroke();

        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.fill();
        ctx.restore();
      } else if (waveformStyle === 'frequency_wave') {
        const centerY = height * 0.65;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x <= width; x += 10) {
          const i = Math.floor((x / width) * 32);
          const val = freqData[i] / 255;
          const y = centerY + Math.sin(x * 0.02 + curTime * 5) * (val * 60 + 10);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. Live Synchronized Captions / Karaoke Text
    if (showCaptions && cues.length > 0) {
      const activeCue = cues.find((c) => curTime >= c.start && curTime <= c.end);
      const textToDisplay = activeCue ? activeCue.text : cues[0]?.text || '';

      if (textToDisplay) {
        const textY = height * 0.35;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${captionFontSize}px 'Noto Nastaliq Urdu', 'Noto Sans Devanagari', 'Plus Jakarta Sans', system-ui`;

        // Background pill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.roundRect(width * 0.08, textY - captionFontSize * 1.4, width * 0.84, captionFontSize * 2.8, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Caption Glow and Fill
        ctx.shadowColor = 'rgba(250, 204, 21, 0.8)';
        ctx.shadowBlur = activeCue ? 20 : 0;
        ctx.fillStyle = activeCue ? '#fef08a' : '#ffffff';
        ctx.fillText(textToDisplay, width / 2, textY);
        ctx.restore();
      }
    }

    // 6. Watermark & Branding
    if (showWatermark) {
      ctx.save();
      ctx.font = `600 15px 'Plus Jakarta Sans', system-ui`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.textAlign = 'center';
      ctx.fillText(watermarkText, width / 2, height - 32);

      // Top Tag
      ctx.font = `500 12px 'Plus Jakarta Sans', system-ui`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(
        videoMode === 'text_to_video'
          ? 'AWAAZ AI • Text to Video'
          : videoMode === 'image_to_video'
          ? 'AWAAZ AI • Image to Video'
          : 'AWAAZ AI • Audio to Video',
        width / 2,
        40
      );
      ctx.restore();
    }

    animFrameRef.current = requestAnimationFrame(drawFrame);
  };

  useEffect(() => {
    drawFrame();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    aspectRatio,
    videoMode,
    themeGradient,
    waveformStyle,
    showCaptions,
    showWatermark,
    watermarkText,
    captionFontSize,
    customBgImage,
    i2vSourceImage,
    i2vParticleEffect,
    cues,
    isPlaying,
  ]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    setupAudioContext();
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // --------------------------------------------------------------------------
  // AI Prompt Enhancer (for Text to Video)
  // --------------------------------------------------------------------------
  const handleEnhancePrompt = async () => {
    if (!t2vPrompt.trim()) return;
    setIsEnhancingPrompt(true);
    setEnhancedPromptNotes(null);
    try {
      const res = await fetch('/api/ai/expand-video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: t2vPrompt,
          mode: 'text_to_video',
          style: t2vStyle,
        }),
      });
      const data = await res.json();
      if (data.result?.enhancedPrompt) {
        setT2vPrompt(data.result.enhancedPrompt);
        setEnhancedPromptNotes(`Camera Movement: ${data.result.cameraMovement || 'Cinematic Push In'}`);
        if (data.result.storyboardScenes && data.result.storyboardScenes.length > 0) {
          setStoryboardScenes(
            data.result.storyboardScenes.map((sc: any, idx: number) => ({
              id: `sc_${Date.now()}_${idx}`,
              shotNumber: sc.shotNumber || idx + 1,
              description: sc.description || '',
              imagePrompt: sc.imagePrompt || '',
            }))
          );
        }
      }
    } catch (err) {
      console.error('Error enhancing video prompt:', err);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // --------------------------------------------------------------------------
  // Google Veo Video Generation (Text to Video or Image to Video)
  // --------------------------------------------------------------------------
  const handleGenerateVeoVideo = async (sourceType: 'text' | 'image') => {
    setIsGeneratingVeoVideo(true);
    setVeoError(null);
    setVeoStatusMessage('Initializing Google Veo AI Video Engine...');
    setVeoPollTimer(0);

    try {
      const payload: any = {
        aspectRatio,
        resolution,
        model: 'veo-3.1-lite-generate-preview',
      };

      if (sourceType === 'text') {
        payload.prompt = t2vPrompt;
      } else {
        if (!i2vSourceImage) {
          throw new Error('Please upload or generate an image first.');
        }
        payload.imageBytes = i2vSourceImage;
        payload.prompt = i2vMotionPrompt;
      }

      const res = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success || !data.operationName) {
        if (data.isQuotaExceeded || data.error?.includes('429') || data.error?.includes('Quota') || data.error?.includes('quota')) {
          setVeoQuotaError(true);
        }
        throw new Error(data.error || 'Failed to initiate video generation.');
      }

      const opName = data.operationName;
      setVeoOperationName(opName);
      setVeoStatusMessage('Synthesizing cinematic frames with Google Veo (this typically takes 1-2 minutes)...');

      // Poll status every 4 seconds
      const pollInterval = window.setInterval(async () => {
        try {
          setVeoPollTimer((prev) => prev + 4);
          const statusRes = await fetch('/api/ai/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName: opName }),
          });

          const statusData = await statusRes.json();
          if (statusData.error) {
            clearInterval(pollInterval);
            setIsGeneratingVeoVideo(false);
            setVeoError(statusData.error.message || 'Video generation encountered an error.');
            return;
          }

          if (statusData.done) {
            clearInterval(pollInterval);
            setVeoStatusMessage('Downloading and streaming completed video...');

            // Fetch video download stream
            const dlRes = await fetch('/api/ai/video-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName: opName }),
            });

            if (!dlRes.ok) {
              throw new Error('Could not download generated video stream.');
            }

            const videoBlob = await dlRes.blob();
            const videoBlobUrl = URL.createObjectURL(videoBlob);

            const newVideoItem: GeneratedAIVideoItem = {
              id: `vid_${Date.now()}`,
              mode: sourceType === 'text' ? 'text_to_video' : 'image_to_video',
              title: sourceType === 'text' ? t2vPrompt.slice(0, 45) : 'Image Motion Video',
              prompt: sourceType === 'text' ? t2vPrompt : i2vMotionPrompt,
              aspectRatio,
              resolution,
              videoUrl: videoBlobUrl,
              durationSeconds: 6,
              timestamp: new Date().toLocaleTimeString(),
            };

            setVideoGallery((prev) => [newVideoItem, ...prev]);
            setSelectedGalleryVideo(newVideoItem);
            setRenderedVideoBlobUrl(videoBlobUrl);
            setIsGeneratingVeoVideo(false);
            setVeoStatusMessage('Video Generation Complete!');
          }
        } catch (pollErr: any) {
          console.error('Polling error:', pollErr);
        }
      }, 4000);
    } catch (err: any) {
      console.error('Error starting video generation:', err);
      setIsGeneratingVeoVideo(false);
      const errMsg = err.message || '';
      if (
        errMsg.includes('429') ||
        errMsg.includes('Quota') ||
        errMsg.includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED')
      ) {
        setVeoQuotaError(true);
      }
      setVeoError(errMsg || 'Failed to start video generation.');
    }
  };

  // --------------------------------------------------------------------------
  // AI Image Generator for Image-to-Video Mode
  // --------------------------------------------------------------------------
  const handleGenerateAiImage = async () => {
    if (!aiImagePrompt.trim()) return;
    setIsGeneratingBaseImage(true);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiImagePrompt,
          aspectRatio,
          style: 'cinematic photorealistic',
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setI2vSourceImage(data.imageUrl);
        setCustomBgImage(data.imageUrl);
      }
    } catch (err) {
      console.error('Error generating AI image:', err);
    } finally {
      setIsGeneratingBaseImage(false);
    }
  };

  // --------------------------------------------------------------------------
  // AI Auto-Generate Background Image from Audio Transcript
  // --------------------------------------------------------------------------
  const handleAutoGenerateA2vBg = async () => {
    if (!activeAudioItem) return;
    setIsGeneratingA2vBg(true);
    try {
      const prompt = `Cinematic artistic scene background depicting: "${activeAudioItem.text.slice(0, 150)}". Mood: poetic, atmospheric lighting, 4K digital art.`;
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          style: 'cinematic digital art',
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setCustomBgImage(data.imageUrl);
      }
    } catch (err) {
      console.error('Error generating A2V background:', err);
    } finally {
      setIsGeneratingA2vBg(false);
    }
  };

  // --------------------------------------------------------------------------
  // Canvas Video Exporter & Recorder (WebM / MP4)
  // --------------------------------------------------------------------------
  const handleExportCanvasVideo = async () => {
    if (!canvasRef.current) return;
    setIsRenderingVideo(true);
    setRenderProgress(0);
    setRenderedVideoBlobUrl(null);

    const canvas = canvasRef.current;
    const canvasStream = canvas.captureStream(30);

    let combinedStream: MediaStream;

    if (activeAudioItem) {
      const renderAudio = new Audio(`data:${activeAudioItem.mimeType};base64,${activeAudioItem.audioBase64}`);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createMediaElementSource(renderAudio);
      source.connect(dest);
      source.connect(audioCtx.destination);

      combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 4000000,
      });

      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRenderedVideoBlobUrl(url);
        setIsRenderingVideo(false);
        setRenderProgress(100);

        const newVideoItem: GeneratedAIVideoItem = {
          id: `vid_${Date.now()}`,
          mode: videoMode,
          title: activeAudioItem.text.slice(0, 40) || 'Audio Visualizer Video',
          prompt: activeAudioItem.text,
          aspectRatio,
          resolution: '1080p',
          videoUrl: url,
          durationSeconds: activeAudioItem.durationSeconds || 6,
          timestamp: new Date().toLocaleTimeString(),
        };
        setVideoGallery((prev) => [newVideoItem, ...prev]);
        setSelectedGalleryVideo(newVideoItem);
      };

      renderAudio.ontimeupdate = () => {
        if (renderAudio.duration) {
          const pct = Math.round((renderAudio.currentTime / renderAudio.duration) * 100);
          setRenderProgress(pct);
        }
      };

      renderAudio.onended = () => {
        recorder.stop();
        audioCtx.close();
      };

      recorder.start();
      await renderAudio.play();
    } else {
      // Record 5 seconds of canvas animation
      combinedStream = new MediaStream([...canvasStream.getVideoTracks()]);
      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm', videoBitsPerSecond: 3500000 });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRenderedVideoBlobUrl(url);
        setIsRenderingVideo(false);
        setRenderProgress(100);
      };

      recorder.start();
      let p = 0;
      const tId = setInterval(() => {
        p += 20;
        setRenderProgress(Math.min(99, p));
      }, 1000);

      setTimeout(() => {
        clearInterval(tId);
        recorder.stop();
      }, 5000);
    }
  };

  const handleExportCanvasVideoWithDetails = async (
    title: string,
    prompt: string,
    modelId: VideoEngineModel
  ) => {
    if (!canvasRef.current) return;
    setIsRenderingVideo(true);
    setRenderProgress(0);
    setRenderedVideoBlobUrl(null);

    const canvas = canvasRef.current;
    const canvasStream = canvas.captureStream(30);

    let combinedStream: MediaStream;

    if (activeAudioItem) {
      const renderAudio = new Audio(`data:${activeAudioItem.mimeType};base64,${activeAudioItem.audioBase64}`);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createMediaElementSource(renderAudio);
      source.connect(dest);
      source.connect(audioCtx.destination);

      combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 4500000,
      });

      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRenderedVideoBlobUrl(url);
        setIsRenderingVideo(false);
        setRenderProgress(100);

        const newVideoItem: GeneratedAIVideoItem = {
          id: `vid_${Date.now()}`,
          mode: videoMode,
          engineModel: modelId,
          title: title || activeAudioItem.text.slice(0, 45) || 'AI Video',
          prompt: prompt || activeAudioItem.text,
          aspectRatio,
          resolution: '1080p',
          videoUrl: url,
          durationSeconds: activeAudioItem.durationSeconds || 6,
          timestamp: new Date().toLocaleTimeString(),
        };
        setVideoGallery((prev) => [newVideoItem, ...prev]);
        setSelectedGalleryVideo(newVideoItem);
      };

      renderAudio.ontimeupdate = () => {
        if (renderAudio.duration) {
          const pct = Math.round((renderAudio.currentTime / renderAudio.duration) * 100);
          setRenderProgress(pct);
        }
      };

      renderAudio.onended = () => {
        recorder.stop();
        audioCtx.close();
      };

      recorder.start();
      await renderAudio.play();
    } else {
      // Record 6 seconds of canvas animation
      combinedStream = new MediaStream([...canvasStream.getVideoTracks()]);
      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm', videoBitsPerSecond: 4000000 });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRenderedVideoBlobUrl(url);
        setIsRenderingVideo(false);
        setRenderProgress(100);

        const newVideoItem: GeneratedAIVideoItem = {
          id: `vid_${Date.now()}`,
          mode: videoMode,
          engineModel: modelId,
          title: title || 'Free AI Video',
          prompt: prompt || 'AI Scene Video',
          aspectRatio,
          resolution: '1080p',
          videoUrl: url,
          durationSeconds: 6,
          timestamp: new Date().toLocaleTimeString(),
        };
        setVideoGallery((prev) => [newVideoItem, ...prev]);
        setSelectedGalleryVideo(newVideoItem);
      };

      recorder.start();
      let p = 0;
      const tId = setInterval(() => {
        p += 16;
        setRenderProgress(Math.min(99, p));
      }, 1000);

      setTimeout(() => {
        clearInterval(tId);
        recorder.stop();
      }, 6000);
    }
  };

  // 100% Free AI Video Generation with Pollinations FLUX + Motion & Audio
  const handleGeneratePollinationsFluxVideo = async () => {
    setIsGeneratingFreeVideo(true);
    setFreeVideoStatusMessage('Synthesizing high-res scene with Pollinations FLUX (100% Free)...');
    try {
      const seed = Math.floor(Math.random() * 999999);
      const { width, height } = getCanvasDimensions();
      const promptText = t2vPrompt.trim() || 'Masjid an-Nabawi in Madinah at golden sunset with glowing minarets, 8k cinematic';
      const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = fluxUrl;

      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn('Pollinations image load fallback to scenic stock');
          img.src = selectedScenicScene?.imageUrl || SCENIC_STOCK_SCENES[0].imageUrl;
          img.onload = () => resolve();
          img.onerror = () => resolve();
        };
        setTimeout(() => resolve(), 8000);
      });

      setCustomBgImage(img.src);
      setI2vSourceImage(img.src);
      setFreeVideoStatusMessage('Rendering cinematic 3D motion, particles & audio tracks...');

      await handleExportCanvasVideoWithDetails(
        promptText.slice(0, 45),
        promptText,
        'pollinations_flux'
      );
    } catch (err: any) {
      console.error('Free video generation error:', err);
    } finally {
      setIsGeneratingFreeVideo(false);
      setFreeVideoStatusMessage('');
    }
  };

  // 100% Free 4K Scenic Loops Export (Islamic, Nature, Ambience)
  const handleExportScenicStockVideo = async () => {
    if (!selectedScenicScene) return;
    setIsGeneratingFreeVideo(true);
    setFreeVideoStatusMessage(`Preparing 4K scenic video: ${selectedScenicScene.title}...`);
    try {
      setCustomBgImage(selectedScenicScene.imageUrl);
      setI2vSourceImage(selectedScenicScene.imageUrl);
      await handleExportCanvasVideoWithDetails(
        selectedScenicScene.title,
        selectedScenicScene.promptDescription,
        'scenic_stock'
      );
    } finally {
      setIsGeneratingFreeVideo(false);
      setFreeVideoStatusMessage('');
    }
  };

  const audioSrc = activeAudioItem
    ? `data:${activeAudioItem.mimeType};base64,${activeAudioItem.audioBase64}`
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/50 via-indigo-950/40 to-pink-950/50 border border-purple-500/25 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 shrink-0">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  AI Video Creation Studio
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase tracking-widest font-mono">
                  Veo • Canvas • 4K
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Generate cinematic videos from text prompts, animate portraits & images into living motion, or create waveform karaoke videos from audio.
              </p>
            </div>
          </div>

          {/* Quick Render CTA */}
          <button
            type="button"
            id="btn-export-active-video"
            onClick={handleExportCanvasVideo}
            disabled={isRenderingVideo}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isRenderingVideo ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Exporting Video ({renderProgress}%)...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>Export HD Video ({aspectRatio})</span>
              </>
            )}
          </button>
        </div>

        {/* Studio Sub-Modes Navigation */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            id="btn-mode-text-to-video"
            onClick={() => setVideoMode('text_to_video')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              videoMode === 'text_to_video'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Type className="w-4 h-4 text-pink-300" />
            <span>1. Text to Video</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-pink-500/30 rounded-full text-pink-200 font-mono">
              Veo AI
            </span>
          </button>

          <button
            type="button"
            id="btn-mode-image-to-video"
            onClick={() => setVideoMode('image_to_video')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              videoMode === 'image_to_video'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-300" />
            <span>2. Image to Video</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/30 rounded-full text-purple-200 font-mono">
              Motion
            </span>
          </button>

          <button
            type="button"
            id="btn-mode-audio-to-video"
            onClick={() => setVideoMode('audio_to_video')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              videoMode === 'audio_to_video'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Volume2 className="w-4 h-4 text-cyan-300" />
            <span>3. Audio to Video</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/30 rounded-full text-cyan-200 font-mono">
              Waveform
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIDEO ENGINE / MODEL SELECTOR (ماڈل کا انتخاب کریں)                        */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Video Generation Engine & Model (ویڈیو ماڈل منتخب کریں)
              </h3>
            </div>
            <p className="text-[11px] text-white/60 mt-0.5">
              Choose your preferred video generator — 100% Free Unlimited engines or Google Veo Cloud AI
            </p>
          </div>
          <span
            className={`text-[10px] font-mono px-3 py-1 rounded-full border flex items-center gap-1.5 self-start sm:self-center font-bold ${
              selectedModel === 'veo_3_1'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                selectedModel === 'veo_3_1' ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            {selectedModel === 'veo_3_1' ? 'Paid Gemini Quota Mode' : '100% Free Unlimited Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {VIDEO_ENGINE_MODELS.map((m) => {
            const isSelected = selectedModel === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedModel(m.id);
                  if (m.id === 'audio_visualizer') {
                    setVideoMode('audio_to_video');
                  } else if (m.id === 'scenic_stock') {
                    setVideoMode('image_to_video');
                    if (selectedScenicScene) {
                      setCustomBgImage(selectedScenicScene.imageUrl);
                      setI2vSourceImage(selectedScenicScene.imageUrl);
                    }
                  } else if (m.id === 'pollinations_flux' || m.id === 'veo_3_1') {
                    setVideoMode('text_to_video');
                  }
                }}
                className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between gap-3 relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-purple-950/70 to-black border-pink-500 shadow-lg shadow-pink-500/15 ring-1 ring-pink-500/50'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        m.isFree
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {m.badge}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-white tracking-tight">{m.name}</div>
                    <div className="text-[10px] text-pink-300/90 font-medium font-urdu">{m.urduName}</div>
                  </div>

                  <p className="text-[10px] text-white/50 leading-relaxed line-clamp-2">
                    {m.urduDescription}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/40">
                  <span>{m.costLabel}</span>
                  <span>{m.speedLabel}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Mode Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* ========================================================================= */}
          {/* MODE 1: TEXT TO VIDEO (T2V)                                               */}
          {/* ========================================================================= */}
          {videoMode === 'text_to_video' && (
            <div className="p-6 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                    <Clapperboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Text to Video Prompt Director</h3>
                    <p className="text-[11px] text-white/50">Turn text scripts into cinematic 4K AI videos</p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-enhance-prompt"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancingPrompt || !t2vPrompt.trim()}
                  className="px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
                  <span>{isEnhancingPrompt ? 'Enhancing...' : 'AI Enhance Prompt'}</span>
                </button>
              </div>

              {/* Active Model Indicator Banner */}
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedModel === 'veo_3_1'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {selectedModel === 'veo_3_1' ? 'Paid Model' : '100% Free'}
                  </span>
                  <div className="text-xs text-white">
                    <span className="font-semibold">Active Model: </span>
                    <span className="text-pink-300">
                      {VIDEO_ENGINE_MODELS.find((m) => m.id === selectedModel)?.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedModel('pollinations_flux')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-all ${
                      selectedModel === 'pollinations_flux'
                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Free FLUX
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedModel('veo_3_1')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-all ${
                      selectedModel === 'veo_3_1'
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Veo AI
                  </button>
                </div>
              </div>

              {/* Prompt Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70">Video Prompt / Scene Description</label>
                <textarea
                  id="t2v-prompt-input"
                  rows={4}
                  value={t2vPrompt}
                  onChange={(e) => setT2vPrompt(e.target.value)}
                  placeholder="e.g. Badshahi Mosque in Lahore at golden sunset with flying pigeons, cinematic 4k drone shot..."
                  className="w-full p-3.5 bg-black/50 border border-white/15 rounded-2xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-pink-500 leading-relaxed font-sans"
                />

                {enhancedPromptNotes && (
                  <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-[11px] text-pink-200 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span>{enhancedPromptNotes}</span>
                  </div>
                )}
              </div>

              {/* Prompt Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-white/60">Quick Inspiration Presets (آئیڈیاز)</label>
                <div className="flex flex-wrap gap-2">
                  {VIDEO_PROMPT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setT2vPrompt(preset.prompt);
                        setT2vCameraMotion(preset.camera as CameraMotionType);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>{preset.title}</span>
                      <span className="text-[9px] text-pink-300 font-urdu">{preset.urduTitle}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Format & Engine Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
                <div>
                  <label className="text-[11px] font-semibold text-white/70 mb-1.5 block">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="16:9" className="bg-neutral-900">16:9 Landscape (YouTube)</option>
                    <option value="9:16" className="bg-neutral-900">9:16 Portrait (Shorts/Reels)</option>
                    <option value="1:1" className="bg-neutral-900">1:1 Square (Instagram)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-white/70 mb-1.5 block">Camera Motion</label>
                  <select
                    value={t2vCameraMotion}
                    onChange={(e) => setT2vCameraMotion(e.target.value as CameraMotionType)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="drone_sweep" className="bg-neutral-900">Aerial Drone Sweep</option>
                    <option value="push_in" className="bg-neutral-900">Cinematic Push In</option>
                    <option value="pan_right" className="bg-neutral-900">Dynamic Pan Right</option>
                    <option value="slow_motion" className="bg-neutral-900">Slow Motion 60fps</option>
                    <option value="living_portrait" className="bg-neutral-900">Living Portrait Depth</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-white/70 mb-1.5 block">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="720p" className="bg-neutral-900">720p HD (Fast)</option>
                    <option value="1080p" className="bg-neutral-900">1080p Full HD (Premium)</option>
                  </select>
                </div>
              </div>

              {/* Generate Action Buttons depending on selectedModel */}
              <div className="space-y-3 pt-2">
                {selectedModel === 'pollinations_flux' ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      id="btn-generate-free-flux-video"
                      onClick={handleGeneratePollinationsFluxVideo}
                      disabled={isGeneratingFreeVideo || !t2vPrompt.trim()}
                      className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {isGeneratingFreeVideo ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Free Video ({renderProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Free AI Video (Pollinations FLUX • مفت ویڈیو بنائیں)</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedModel('veo_3_1')}
                      className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold cursor-pointer transition-all"
                    >
                      Switch to Veo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      id="btn-generate-veo-t2v"
                      onClick={() => handleGenerateVeoVideo('text')}
                      disabled={isGeneratingVeoVideo || !t2vPrompt.trim()}
                      className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {isGeneratingVeoVideo ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating with Veo AI ({veoPollTimer}s)...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Google Veo AI Video (Paid Quota)</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedModel('pollinations_flux')}
                      className="px-4 py-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Use Free Model</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Free Video Status message */}
              {isGeneratingFreeVideo && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>{freeVideoStatusMessage}</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 animate-pulse"
                      style={{ width: `${Math.max(10, renderProgress)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/50">
                    100% Free Pollinations FLUX Engine synthesizes high-res visuals with zero API quota.
                  </p>
                </div>
              )}

              {/* Veo Loading/Status message */}
              {isGeneratingVeoVideo && (
                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                    <span>{veoStatusMessage}</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-500 animate-pulse"
                      style={{ width: `${Math.min(95, (veoPollTimer / 80) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/50">
                    Google Veo synthesizes photorealistic motion latents. Please keep this tab open.
                  </p>
                </div>
              )}

              {/* Quota Exceeded / Error Banner with 1-Click Free Model Switch */}
              {(veoQuotaError || (veoError && veoError.includes('429'))) && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-amber-100">
                        Google Veo Quota Limit Reached (429 RESOURCE_EXHAUSTED)
                      </div>
                      <p className="text-[11px] text-amber-200/80 leading-relaxed font-urdu">
                        گوگل وائیو کے لیے پیڈ بلنگ درکار ہے۔ آپ مفت ماڈل (Pollinations FLUX یا 4K Scenic) منتخب کر کے بغیر کسی چارج کے لامحدود ویڈیوز بنا سکتے ہیں۔
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModel('pollinations_flux');
                      setVeoError(null);
                      setVeoQuotaError(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Switch to Free Model (مفت ماڈل پر سوئچ کریں)</span>
                  </button>
                </div>
              )}

              {veoError && !veoQuotaError && !veoError.includes('429') && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{veoError}</span>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: IMAGE TO VIDEO (I2V)                                              */}
          {/* ========================================================================= */}
          {videoMode === 'image_to_video' && (
            <div className="p-6 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Image to Video Motion Studio</h3>
                    <p className="text-[11px] text-white/50">Animate static photos, portraits & art into living video</p>
                  </div>
                </div>
              </div>

              {/* Source Image Selector (Upload or Generate) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/70">1. Source Image</label>
                  {i2vSourceImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setI2vSourceImage(null);
                        setCustomBgImage(null);
                      }}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear Image
                    </button>
                  )}
                </div>

                {i2vSourceImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-purple-500/40 max-h-56 flex items-center justify-center bg-black">
                    <img src={i2vSourceImage} alt="Source" className="w-full h-auto object-cover max-h-56" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-[10px] text-purple-300 font-mono">
                      Image Loaded
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Upload Box */}
                      <label className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-dashed border-white/20 text-center hover:bg-white/10 hover:border-purple-500 transition-all cursor-pointer">
                        <Upload className="w-7 h-7 text-purple-400 mb-2" />
                        <span className="text-xs font-bold text-white">Upload Your Image</span>
                        <span className="text-[10px] text-white/40 mt-0.5">JPG, PNG, WEBP up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const b64 = reader.result as string;
                                setI2vSourceImage(b64);
                                setCustomBgImage(b64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {/* AI Generate Image Box */}
                      <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span>Generate Image with AI</span>
                          </span>
                          <input
                            type="text"
                            value={aiImagePrompt}
                            onChange={(e) => setAiImagePrompt(e.target.value)}
                            placeholder="e.g. Mughal palace in golden sunset..."
                            className="w-full mt-2 px-2.5 py-1.5 bg-black/50 border border-white/15 rounded-xl text-[11px] text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <button
                          type="button"
                          id="btn-generate-base-image"
                          onClick={handleGenerateAiImage}
                          disabled={isGeneratingBaseImage || !aiImagePrompt.trim()}
                          className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isGeneratingBaseImage ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          <span>{isGeneratingBaseImage ? 'Generating Image...' : 'Generate Base Image'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Curated 4K Scenic Scenes Gallery */}
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                          <span>Or Pick from Curated 4K Scenic Library (4K قدرتی و اسلامی مناظر)</span>
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                          100% Free
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {SCENIC_STOCK_SCENES.slice(0, 5).map((scene) => (
                          <button
                            key={scene.id}
                            type="button"
                            onClick={() => {
                              setSelectedScenicScene(scene);
                              setI2vSourceImage(scene.imageUrl);
                              setCustomBgImage(scene.imageUrl);
                              setI2vParticleEffect(scene.defaultParticles);
                            }}
                            className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-pink-500 transition-all text-left aspect-video cursor-pointer"
                          >
                            <img
                              src={scene.imageUrl}
                              alt={scene.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                              <span className="text-[9px] font-bold text-white truncate">{scene.title}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Motion Style & Camera Preset */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-white/70">2. Motion Style & Camera Shaders</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'living_portrait', label: 'Living Portrait', desc: 'Subtle breathing' },
                    { id: 'zoom_parallax', label: '3D Parallax Zoom', desc: 'Cinematic push-in' },
                    { id: 'pan_sweep', label: 'Camera Pan', desc: 'Horizontal sweep' },
                    { id: 'ambient_particles', label: 'Weather Effects', desc: 'Rain/Embers motion' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setI2vMotionStyle(m.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        i2vMotionStyle === m.id
                          ? 'bg-purple-950/70 border-purple-500 text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xs font-bold">{m.label}</div>
                      <div className="text-[10px] text-white/40">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Atmospheric Weather Particles */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70">Atmospheric Particle Layers</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'gold_embers', label: '✨ Embers' },
                    { id: 'rain', label: '🌧️ Rain' },
                    { id: 'snow', label: '❄️ Snow' },
                    { id: 'rose_petals', label: '🌹 Petals' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setI2vParticleEffect(p.id as any)}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        i2vParticleEffect === p.id
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Motion Prompt Direction</label>
                <input
                  type="text"
                  value={i2vMotionPrompt}
                  onChange={(e) => setI2vMotionPrompt(e.target.value)}
                  placeholder="e.g. Water rippling in the river with gentle wind blowing scarf..."
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* 100% Free Living Motion Export */}
                  <button
                    type="button"
                    id="btn-export-free-i2v-video"
                    onClick={() =>
                      handleExportCanvasVideoWithDetails(
                        'Living Motion Video',
                        i2vMotionPrompt || '3D Parallax living motion',
                        'scenic_stock'
                      )
                    }
                    disabled={isRenderingVideo || !i2vSourceImage}
                    className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isRenderingVideo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Rendering Living Motion Video ({renderProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Export Living Motion Video (100% Free • مفت ویڈیو بنائیں)</span>
                      </>
                    )}
                  </button>

                  {/* Google Veo Option */}
                  <button
                    type="button"
                    id="btn-generate-veo-i2v"
                    onClick={() => handleGenerateVeoVideo('image')}
                    disabled={isGeneratingVeoVideo || !i2vSourceImage}
                    className="py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isGeneratingVeoVideo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Veo AI ({veoPollTimer}s)...</span>
                      </>
                    ) : (
                      <>
                        <Film className="w-4 h-4" />
                        <span>Animate with Veo AI (Paid)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Veo Loading/Status message */}
                {isGeneratingVeoVideo && (
                  <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                      <span>{veoStatusMessage}</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-500 animate-pulse"
                        style={{ width: `${Math.min(95, (veoPollTimer / 80) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-white/50">
                      Google Veo synthesizes photorealistic motion latents. Please keep this tab open.
                    </p>
                  </div>
                )}

                {/* Quota Exceeded Alert */}
                {(veoQuotaError || (veoError && veoError.includes('429'))) && (
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-amber-100">
                          Google Veo Quota Limit Reached (429 RESOURCE_EXHAUSTED)
                        </div>
                        <p className="text-[11px] text-amber-200/80 leading-relaxed font-urdu">
                          کوٹہ ختم ہو گیا ہے۔ آپ اوپر والا سبز بٹن دبا کر 100% مفت موشن ویڈیو ایکسپورٹ کر سکتے ہیں۔
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 3: AUDIO TO VIDEO (A2V) & WAVEFORM KARAOKE                          */}
          {/* ========================================================================= */}
          {videoMode === 'audio_to_video' && (
            <div className="p-6 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Audio to Waveform & Karaoke Video</h3>
                    <p className="text-[11px] text-white/50">Turn voice clips, poetry & narration into animated videos</p>
                  </div>
                </div>

                {activeAudioItem && (
                  <button
                    type="button"
                    id="btn-ai-auto-bg"
                    onClick={handleAutoGenerateA2vBg}
                    disabled={isGeneratingA2vBg}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingA2vBg ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingA2vBg ? 'Painting...' : 'AI Auto-Paint Background'}</span>
                  </button>
                )}
              </div>

              {/* Active Audio Item Pill */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate">
                      {activeAudioItem ? (activeAudioItem.text.slice(0, 45) + '...') : 'No Active Audio Selected'}
                    </div>
                    <div className="text-[10px] text-white/50">
                      {activeAudioItem ? `Duration: ${activeAudioItem.durationSeconds?.toFixed(1)}s • Voice: ${activeAudioItem.voiceName || activeAudioItem.voice}` : 'Generate audio from TTS or select from library'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Waveform Style */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70">Audio Visualizer Waveform Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'neon_bars', label: 'Neon Equalizer Bars' },
                    { id: 'circular_radial', label: 'Radial Circular Pulse' },
                    { id: 'frequency_wave', label: 'Flowing Sinusoid Wave' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWaveformStyle(item.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        waveformStyle === item.id
                          ? 'bg-cyan-600 border-cyan-400 text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Theme & Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70 flex items-center justify-between">
                  <span>Background Atmosphere Theme</span>
                  {customBgImage && (
                    <button
                      type="button"
                      onClick={() => setCustomBgImage(null)}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Reset to Theme
                    </button>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'cyber_indigo', label: 'Cyber Indigo', color: 'from-indigo-900 to-black' },
                    { id: 'sunset_crimson', label: 'Sunset Ruby', color: 'from-rose-900 to-black' },
                    { id: 'cosmic_aurora', label: 'Emerald Aurora', color: 'from-emerald-900 to-black' },
                    { id: 'amber_gold', label: 'Warm Amber', color: 'from-amber-900 to-black' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => {
                        setCustomBgImage(null);
                        setThemeGradient(bg.id);
                      }}
                      className={`p-2 rounded-xl border text-center text-[11px] font-medium transition-all cursor-pointer ${
                        themeGradient === bg.id && !customBgImage
                          ? 'border-cyan-400 ring-2 ring-cyan-500/30 text-white font-bold'
                          : 'border-white/10 text-white/60 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-full h-4 rounded-md bg-gradient-to-r ${bg.color} mb-1`} />
                      <span>{bg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitles & Branding Settings */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/70 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCaptions}
                      onChange={(e) => setShowCaptions(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Render Synchronized Captions on Video</span>
                  </label>
                  {showCaptions && (
                    <span className="text-[11px] text-white/40 font-mono">
                      Size: {captionFontSize}px
                    </span>
                  )}
                </div>

                {showCaptions && (
                  <input
                    type="range"
                    min={24}
                    max={52}
                    step={2}
                    value={captionFontSize}
                    onChange={(e) => setCaptionFontSize(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIDEO GALLERY & GENERATED CLIPS HISTORY                                   */}
          {/* ========================================================================= */}
          {videoGallery.length > 0 && (
            <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span>Created Videos History ({videoGallery.length})</span>
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videoGallery.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white truncate max-w-[180px]">{vid.title}</div>
                        <div className="text-[10px] text-white/40 font-mono">
                          {vid.aspectRatio} • {vid.resolution} • {vid.durationSeconds}s
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                        {vid.mode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={vid.videoUrl}
                        download={`awaaz_video_${vid.id}.mp4`}
                        className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download MP4</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Video Canvas Stage & Playback (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="p-5 rounded-3xl bg-[#0c0d14] border border-white/10 space-y-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Live Video Output Monitor</span>
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {aspectRatio}
              </span>
            </div>

            {/* Video Stage Frame */}
            <div
              className={`relative bg-black rounded-2xl overflow-hidden border border-white/15 shadow-2xl flex items-center justify-center ${
                aspectRatio === '9:16'
                  ? 'w-[260px] h-[462px]'
                  : aspectRatio === '16:9'
                  ? 'w-full max-w-[420px] h-[236px]'
                  : 'w-[320px] h-[320px]'
              }`}
            >
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
            </div>

            {/* Audio Playback Controls */}
            {audioSrc && (
              <div className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <audio
                  ref={audioRef}
                  src={audioSrc}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
                <button
                  type="button"
                  id="btn-play-video-stage"
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30 cursor-pointer shrink-0"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] text-white/50 font-mono">
                    <span>{currentTime.toFixed(1)}s</span>
                    <span>{duration.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={0.05}
                    value={currentTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (audioRef.current) {
                        audioRef.current.currentTime = val;
                        setCurrentTime(val);
                      }
                    }}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Download Banner for Rendered Video */}
            {renderedVideoBlobUrl && (
              <div className="w-full p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Video Ready for Download!</span>
                </div>
                <a
                  href={renderedVideoBlobUrl}
                  download={`awaaz_ai_video_${Date.now()}.mp4`}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Save Video to Device</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
