import React, { useState, useRef } from 'react';

interface MultiImageUploadInputProps {
  label?: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  helpText?: string;
}

/**
 * Resizes and compresses an image file using an offscreen HTML5 Canvas.
 * Produces crisp, high-quality images while keeping base64 size typically ~60-120KB.
 */
function compressImageFile(file: File, maxDim = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    // SVGs don't need rasterization
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read SVG'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
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
            resolve(String(e.target?.result || ''));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          resolve(String(e.target?.result || ''));
        }
      };
      img.onerror = () => reject(new Error('Could not decode image'));
      img.src = String(e.target?.result || '');
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const MultiImageUploadInput: React.FC<MultiImageUploadInputProps> = ({
  label = 'Product Images',
  images = [],
  onChange,
  maxImages = 8,
  helpText = 'Upload multiple photos from your device or paste image URLs. The first image is the primary cover.'
}) => {
  const [mode, setMode] = useState<'device' | 'url'>('device');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = Math.max(0, maxImages - images.length);

  const processFiles = async (files: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setError(`"${file.name}" is not an image file.`);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError(`"${file.name}" is too large (max 20MB).`);
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    if (validFiles.length > remainingSlots) {
      setError(`You can only add ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} (max ${maxImages}).`);
      return;
    }

    setIsProcessing(true);
    try {
      const compressedResults: string[] = [];
      for (const file of validFiles) {
        const compressed = await compressImageFile(file);
        compressedResults.push(compressed);
      }
      onChange([...images, ...compressedResults]);
    } catch (err: any) {
      setError(err?.message || 'Failed to process selected images.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!/^https?:\/\/\S+$/i.test(trimmed) && !trimmed.startsWith('data:image/')) {
      setError('Please enter a valid image URL starting with http:// or https://');
      return;
    }

    if (images.length >= maxImages) {
      setError(`Maximum of ${maxImages} images allowed.`);
      return;
    }

    onChange([...images, trimmed]);
    setUrlInput('');
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleMakePrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const selected = images[indexToPrimary];
    const rest = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([selected, ...rest]);
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Label and counter */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {label} <span className="text-slate-400 font-normal">({images.length}/{maxImages})</span>
        </label>
        <span className="text-[11px] text-slate-500 font-medium">
          {images.length === 0 ? 'No images selected' : `${images.length} image${images.length > 1 ? 's' : ''} added`}
        </span>
      </div>

      {helpText && <p className="text-[11px] text-slate-500">{helpText}</p>}

      {/* Tabs: Device vs URL */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold w-fit">
        <button
          type="button"
          onClick={() => {
            setMode('device');
            setError(null);
          }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
            mode === 'device'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-sm">upload_file</span>
          Upload from Device
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('url');
            setError(null);
          }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
            mode === 'url'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-sm">link</span>
          Image URL
        </button>
      </div>

      {/* Upload Zone */}
      {remainingSlots > 0 ? (
        mode === 'device' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.length) {
                void processFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/60'
                : 'border-slate-200 bg-slate-50/60 hover:border-brand-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  void processFiles(e.target.files);
                }
              }}
            />
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl text-brand-600">
                {isProcessing ? 'hourglass_top' : 'add_photo_alternate'}
              </span>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-800">
              {isProcessing
                ? 'Optimizing images…'
                : 'Click to select or drag & drop product images'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Select multiple photos · PNG, JPG, WebP, SVG · Auto-compressed
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/product-photo.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={() => handleAddUrl()}
              disabled={!urlInput.trim()}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add
            </button>
          </div>
        )
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
          Maximum of {maxImages} images reached. Remove an image to add a new one.
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}

      {/* Image Thumbnails Gallery */}
      {images.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Selected Images ({images.length})
          </span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`group relative overflow-hidden rounded-2xl bg-white ring-1 transition-all ${
                  idx === 0 ? 'ring-2 ring-brand-500 shadow-xs' : 'ring-slate-200'
                }`}
              >
                {/* Image preview */}
                <div className="aspect-square w-full bg-slate-100">
                  <img
                    src={img}
                    alt={`Product preview ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Primary cover badge */}
                {idx === 0 && (
                  <span className="absolute left-2 top-2 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-xs">
                    Cover
                  </span>
                )}

                {/* Overlay Controls */}
                <div className="absolute inset-0 flex flex-col justify-between bg-slate-900/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      title="Remove image"
                      className="rounded-lg bg-rose-600 p-1 text-white shadow-xs hover:bg-rose-700"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMove(idx, idx - 1)}
                          title="Move left"
                          className="rounded-lg bg-white/90 p-1 text-slate-800 shadow-xs hover:bg-white"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_back</span>
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMove(idx, idx + 1)}
                          title="Move right"
                          className="rounded-lg bg-white/90 p-1 text-slate-800 shadow-xs hover:bg-white"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      )}
                    </div>

                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleMakePrimary(idx)}
                        className="rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold text-brand-700 shadow-xs hover:bg-white"
                      >
                        Set Cover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
