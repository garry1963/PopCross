import React from 'react';
import { Tv, Film, Music, Zap, Trophy, Star, Grid3X3, Watch, Gamepad2, Ghost, Medal, Smartphone } from 'lucide-react';
import { Category } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'tv',
    name: 'TV Bingers',
    icon: <Tv className="w-6 h-6" />,
    description: 'Sitcoms, Dramas, Reality',
    color: 'text-neon-cyan border-neon-cyan'
  },
  {
    id: 'movies',
    name: 'Blockbusters',
    icon: <Film className="w-6 h-6" />,
    description: 'Oscars, Indie, Action',
    color: 'text-neon-purple border-neon-purple'
  },
  {
    id: 'music',
    name: 'Hit Makers',
    icon: <Music className="w-6 h-6" />,
    description: 'Pop, Rock, Hip-Hop',
    color: 'text-neon-pink border-neon-pink'
  },
  {
    id: '90s',
    name: '90s Nostalgia',
    icon: <Zap className="w-6 h-6" />,
    description: 'The Golden Era',
    color: 'text-neon-yellow border-neon-yellow'
  },
  {
    id: 'gaming',
    name: 'Gaming Legends',
    icon: <Gamepad2 className="w-6 h-6" />,
    description: 'Consoles, RPGs, FPS',
    color: 'text-lime-400 border-lime-400'
  },
  {
    id: 'anime',
    name: 'Anime World',
    icon: <Ghost className="w-6 h-6" />,
    description: 'Heroes, Villains, Magic',
    color: 'text-orange-400 border-orange-400'
  },
  {
    id: 'sports',
    name: 'Sports Icons',
    icon: <Medal className="w-6 h-6" />,
    description: 'Athletes & Teams',
    color: 'text-blue-400 border-blue-400'
  },
  {
    id: 'tech',
    name: 'Tech & Trends',
    icon: <Smartphone className="w-6 h-6" />,
    description: 'Viral, Social, Apps',
    color: 'text-rose-400 border-rose-400'
  }
];

export const ICONS = {
  Trophy: <Trophy className="w-5 h-5" />,
  Star: <Star className="w-5 h-5" />,
  Grid: <Grid3X3 className="w-5 h-5" />,
  Time: <Watch className="w-5 h-5" />,
};