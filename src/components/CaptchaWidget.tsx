import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface CaptchaWidgetProps {
  value: string;
  onChange: (val: string) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({
  value,
  onChange,
  onValidationChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [isRotating, setIsRotating] = useState<boolean>(false);

  // Generate randomized alphanumeric string without ambiguous characters
  const generateCode = (): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const refreshCaptcha = () => {
    setIsRotating(true);
    const newCode = generateCode();
    setCaptchaCode(newCode);
    setTimeout(() => setIsRotating(false), 400);
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  // Check validation whenever value or code changes
  useEffect(() => {
    const isValid = value.trim().toUpperCase() === captchaCode;
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [value, captchaCode, onValidationChange]);

  // Draw on canvas with botanical nature distortion
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !captchaCode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Natural botanical gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0f291e'); // Deep pine green
    bgGrad.addColorStop(0.5, '#143829'); // Forest moss
    bgGrad.addColorStop(1, '#0b1f17'); // Dark botanical slate
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Organic noise dots & micro-leaves
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(167, 243, 208, 0.15)';
      ctx.beginPath();
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 2.5 + 0.5;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Subtle curved vine distortion lines
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(52, 211, 153, 0.35)' : 'rgba(110, 231, 183, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * height);
      ctx.bezierCurveTo(
        width * 0.3, Math.random() * height,
        width * 0.7, Math.random() * height,
        width, Math.random() * height
      );
      ctx.stroke();
    }

    // 4. Render distorted alphanumeric characters with botanical hues
    const charHues = ['#34d399', '#6ee7b7', '#a7f3d0', '#86efac', '#a3e635'];
    const charSpacing = width / (captchaCode.length + 1);

    for (let i = 0; i < captchaCode.length; i++) {
      const ch = captchaCode[i];
      ctx.save();
      
      const x = charSpacing * (i + 0.8) + (Math.random() * 4 - 2);
      const y = height / 2 + 7 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 32 - 16) * (Math.PI / 180);

      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.font = `bold ${Math.floor(Math.random() * 4 + 22)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = charHues[i % charHues.length];
      ctx.shadowColor = 'rgba(52, 211, 153, 0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(ch, 0, 0);

      ctx.restore();
    }
  }, [captchaCode]);

  const isValidMatch = value.trim().length > 0 && value.trim().toUpperCase() === captchaCode;
  const isInvalidMatch = value.trim().length >= 5 && !isValidMatch;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Security Verification (CAPTCHA)</span>
        </label>
        <span className="text-[11px] font-mono text-emerald-400/80">Case-insensitive</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Canvas Display */}
        <div className="relative rounded-lg overflow-hidden border border-emerald-700/50 shadow-inner bg-[#0f291e]">
          <canvas
            ref={canvasRef}
            width={160}
            height={44}
            className="block select-none pointer-events-none"
          />
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={refreshCaptcha}
          title="Generate new nature security code"
          className="p-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-100 rounded-lg border border-emerald-700/50 transition-all active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
        </button>

        {/* Input Field */}
        <div className="relative flex-1">
          <input
            type="text"
            maxLength={6}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type code..."
            className={`w-full bg-[#0d2118]/80 text-emerald-100 placeholder-emerald-700/70 text-xs font-mono tracking-widest px-3 py-2.5 rounded-lg border transition-all focus:outline-none uppercase ${
              isValidMatch
                ? 'border-emerald-400 ring-1 ring-emerald-400'
                : (isInvalidMatch ? 'border-rose-500 ring-1 ring-rose-500' : 'border-emerald-700/60 focus:border-emerald-400')
            }`}
          />
          {isValidMatch && (
            <div className="absolute right-2.5 top-2.5 text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
          )}
          {isInvalidMatch && (
            <div className="absolute right-2.5 top-2.5 text-rose-400" title="Code does not match">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
