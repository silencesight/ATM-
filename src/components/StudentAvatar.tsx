import React from 'react';
import { getPresetAvatar } from '../utils/imageCompressor';

interface StudentAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const preset = getPresetAvatar(avatarUrl);
  const isImage = avatarUrl && avatarUrl.startsWith('data:image/');

  const sizeMap: Record<string, string> = {
    xs: 'w-7 h-7 rounded-lg text-xs',
    sm: 'w-9 h-9 rounded-xl text-sm',
    md: 'w-12 h-12 rounded-2xl text-lg',
    lg: 'w-16 h-16 rounded-2xl text-2xl',
    xl: 'w-20 h-20 rounded-3xl text-3xl',
  };

  const dims = sizeMap[size] || sizeMap.md;

  if (isImage) {
    return (
      <div
        className={`${dims} relative overflow-hidden border-2 border-primary-container/50 shadow-md shrink-0 bg-surface-container-lowest ${className}`}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (preset) {
    return (
      <div
        className={`${dims} bg-gradient-to-br ${preset.gradient} border-2 ${preset.border} shadow-md flex items-center justify-center select-none shrink-0 ${className}`}
        title={preset.label}
      >
        <span className="drop-shadow">{preset.emoji}</span>
      </div>
    );
  }

  return (
    <div
      className={`${dims} bg-gradient-to-br from-primary-container via-secondary-container to-surface-container-highest p-[2px] shadow-md shrink-0 ${className}`}
    >
      <div className="w-full h-full rounded-[inherit] bg-surface-container-lowest flex items-center justify-center font-headline font-extrabold text-primary-container uppercase">
        {(name || 'S').charAt(0)}
      </div>
    </div>
  );
};
