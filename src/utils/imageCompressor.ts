export interface PresetBankAvatar {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  border: string;
  minScore?: number;
}

export const PRESET_BANK_AVATARS: PresetBankAvatar[] = [
  {
    id: 'preset:cyber-fox',
    label: 'Cyber Fox',
    emoji: '🦊',
    gradient: 'from-cyan-500 via-blue-600 to-indigo-900',
    border: 'border-cyan-400/60',
  },
  {
    id: 'preset:emerald-dragon',
    label: 'Emerald Dragon',
    emoji: '🐉',
    gradient: 'from-emerald-400 via-teal-600 to-slate-900',
    border: 'border-emerald-400/60',
  },
  {
    id: 'preset:astro-scholar',
    label: 'Astro Scholar',
    emoji: '👨‍🚀',
    gradient: 'from-indigo-500 via-purple-600 to-slate-950',
    border: 'border-indigo-400/60',
  },
  {
    id: 'preset:royal-lion',
    label: 'Gold Sovereign',
    emoji: '🦁',
    gradient: 'from-amber-400 via-orange-600 to-stone-900',
    border: 'border-amber-400/60',
  },
  {
    id: 'preset:neon-unicorn',
    label: 'Prism Unicorn',
    emoji: '🦄',
    gradient: 'from-fuchsia-500 via-pink-600 to-indigo-950',
    border: 'border-pink-400/60',
  },
  {
    id: 'preset:stealth-panther',
    label: 'Obsidian Panther',
    emoji: '🐆',
    gradient: 'from-slate-600 via-zinc-800 to-black',
    border: 'border-slate-300/50',
  },
  {
    id: 'preset:wise-owl',
    label: 'Oxford Owl',
    emoji: '🦉',
    gradient: 'from-sky-400 via-blue-700 to-slate-900',
    border: 'border-sky-300/60',
  },
  {
    id: 'preset:phoenix-fire',
    label: 'Ruby Phoenix',
    emoji: '🦅',
    gradient: 'from-rose-500 via-red-600 to-stone-950',
    border: 'border-rose-400/60',
  },
  {
    id: 'preset:robo-banker',
    label: 'Mecha Banker',
    emoji: '🤖',
    gradient: 'from-teal-400 via-cyan-600 to-slate-950',
    border: 'border-teal-300/60',
  },
  {
    id: 'preset: lightning-bolt',
    label: 'Volt Striker',
    emoji: '⚡',
    gradient: 'from-yellow-400 via-amber-500 to-slate-900',
    border: 'border-yellow-300/60',
  },
  {
    id: 'preset:crown-vip',
    label: 'Executive Crown',
    emoji: '👑',
    gradient: 'from-amber-300 via-yellow-600 to-neutral-950',
    border: 'border-amber-300/80',
  },
  {
    id: 'preset:diamond-apex',
    label: 'Diamond Apex',
    emoji: '💎',
    gradient: 'from-cyan-300 via-sky-500 to-indigo-950',
    border: 'border-cyan-200/80',
  },
];

export function getPresetAvatar(avatarUrl?: string): PresetBankAvatar | null {
  if (!avatarUrl || !avatarUrl.startsWith('preset:')) return null;
  return PRESET_BANK_AVATARS.find((a) => a.id === avatarUrl) || null;
}

/**
 * Compresses an uploaded image file (Profile Avatar or Notebook Photo) using HTML5 Canvas
 * so it is small enough for fast real-time cloud synchronization and localStorage.
 */
export function compressImageFile(
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
    squareCrop?: boolean;
  } = {}
): Promise<string> {
  const { maxDimension = 1100, quality = 0.78, squareCrop = false } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const srcDataUrl = event.target?.result as string;
      if (!srcDataUrl) {
        reject(new Error('Empty image data.'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(srcDataUrl);
            return;
          }

          if (squareCrop) {
            const side = Math.min(img.width, img.height);
            const sx = (img.width - side) / 2;
            const sy = (img.height - side) / 2;
            const targetSize = Math.min(side, maxDimension);
            canvas.width = targetSize;
            canvas.height = targetSize;
            ctx.drawImage(img, sx, sy, side, side, 0, 0, targetSize, targetSize);
          } else {
            let width = img.width;
            let height = img.height;
            if (width > maxDimension || height > maxDimension) {
              if (width >= height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
          }

          // Prefer WebP if supported, fallback to JPEG
          let output = canvas.toDataURL('image/webp', quality);
          if (!output.startsWith('data:image/webp')) {
            output = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(output);
        } catch (err) {
          reject(err);
        }
      };
      img.src = srcDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
