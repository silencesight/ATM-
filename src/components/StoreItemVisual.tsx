import React from 'react';
import {
  BookCheck,
  DoorOpen,
  Star,
  Clock,
  Dices,
  Gift,
  Package,
  Award,
  Sparkles,
  ShoppingBag,
  Trophy
} from 'lucide-react';
import { StoreItem } from '../types';

interface StoreItemVisualProps {
  iconType?: StoreItem['iconType'] | string;
  emoji?: string;
  className?: string;
  category?: StoreItem['category'];
}

export const StoreItemVisual: React.FC<StoreItemVisualProps> = ({
  iconType = 'custom',
  emoji,
  className = 'w-5 h-5',
  category,
}) => {
  // If a custom emoji is set, display it cleanly and minimally
  if (emoji && emoji.trim()) {
    return (
      <span
        className="select-none leading-none inline-flex items-center justify-center text-xl transition-transform group-hover:scale-110"
        role="img"
        aria-label="Item emoji"
      >
        {emoji.trim()}
      </span>
    );
  }

  // Normal, minimalist Lucide vector icons
  const iconProps = {
    className: `${className} stroke-[2] transition-transform duration-200 group-hover:scale-110 shrink-0`,
  };

  switch (iconType) {
    case 'skip-hw':
    case 'skip_hw':
      return <BookCheck {...iconProps} className={`${iconProps.className} text-emerald-400`} />;

    case 'skip-lesson':
    case 'skip_lesson':
      return <DoorOpen {...iconProps} className={`${iconProps.className} text-sky-400`} />;

    case 'extra-points-hw':
    case 'extra-points-lss':
    case 'extra_points':
      return <Star {...iconProps} className={`${iconProps.className} text-amber-400 fill-amber-400/20`} />;

    case 'half-lesson':
    case 'half_lesson':
      return <Clock {...iconProps} className={`${iconProps.className} text-teal-400`} />;

    case 'lucky-draw':
    case 'spin_wheel':
      return <Dices {...iconProps} className={`${iconProps.className} text-purple-400`} />;

    case 'super-mini-prize':
    case 'gift':
      return <Gift {...iconProps} className={`${iconProps.className} text-rose-400`} />;

    case 'mini-prize':
    case 'mystery_box':
      return <Package {...iconProps} className={`${iconProps.className} text-amber-400`} />;

    default:
      if (category === 'academic') {
        return <Award {...iconProps} className={`${iconProps.className} text-amber-400`} />;
      }
      if (category === 'game') {
        return <Trophy {...iconProps} className={`${iconProps.className} text-purple-400`} />;
      }
      if (category === 'prize') {
        return <Gift {...iconProps} className={`${iconProps.className} text-rose-400`} />;
      }
      if (category === 'privilege') {
        return <Sparkles {...iconProps} className={`${iconProps.className} text-emerald-400`} />;
      }
      return <ShoppingBag {...iconProps} className={`${iconProps.className} text-emerald-400`} />;
  }
};
