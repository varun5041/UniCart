import React, { useState, useRef } from 'react';

interface ImageUploadInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helpText?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label = 'Product Image',
  value,
  onChange,
  required = false,
  helpText
}) => {
  const [mode, setMode] = useState<'device' | 'url'>('device');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setIsProcessing(true);

    // SVG files are read directly as UTF-8 or data URL
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        onChange(String(reader.result || ''));
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setError('Failed to read SVG file.');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    // For raster images (JPEG, PNG, WebP), resize and optimize using an offscreen canvas
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            onChange(String(e.target?.result || ''));
            setIsProcessing(false);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          onChange(optimizedDataUrl);
          setIsProcessing(false);
        } catch {
          onChange(String(e.target?.result || ''));
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setError('Could not decode image.');
        setIsProcessing(false);
      };
      img.src = String(e.target?.result || '');
    };
    reader.onerror = () => {
      setError('Failed to read file from your device.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('device');
              setError(null);
            }}
            className={`rounded-md px-2.5 py-1 transition-all ${
              mode === 'device' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload from Device
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('url');
              setError(null);
            }}
            className={`rounded-md px-2.5 py-1 transition-all ${
              mode === 'url' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {value ? (
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <img src={value} alt="Preview" className="h-full w-full object-contain p-1" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-xs font-bold text-slate-800">
              {value.startsWith('data:') ? 'Image selected from device' : value}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Ready to save with product
            </p>
            <div className="flex items-center gap-2 pt-1">
              {mode === 'device' ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-brand-600 border border-slate-200 hover:bg-slate-50"
                >
                  Choose Different Image
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onChange('')}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : mode === 'device' ? (
        <div>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50/80 bg-white'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 shadow-inner mb-2">
              <span className="material-symbols-outlined text-2xl">
                {isProcessing ? 'progress_activity' : 'add_photo_alternate'}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800">
              {isProcessing ? 'Processing image...' : 'Click to upload from device, or drag and drop'}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Supports PNG, JPG, WebP, or SVG (Up to 5MB)
            </p>
          </div>
        </div>
      ) : (
        <div>
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
          />
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}

      {helpText && !error && (
        <p className="text-[11px] text-slate-400">{helpText}</p>
      )}
    </div>
  );
};
