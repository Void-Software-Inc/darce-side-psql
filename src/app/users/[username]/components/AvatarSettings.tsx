'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { DitherAvatar } from '@/components/dither-kit/avatar';
import { rgb } from '@/components/dither-kit/palette';
import { hueFill } from '@/components/dither-kit/pixel';

interface AvatarSettingsProps {
  username: string;
  hue: number | null;
  onSaved: (hue: number | null) => void;
}

// A ring of hues at 30° steps — the swatch colour is the avatar's real fill so
// what you pick is what you get.
const HUES = Array.from({ length: 12 }, (_, i) => i * 30);

export function AvatarSettings({ username, hue, onSaved }: AvatarSettingsProps) {
  const [selected, setSelected] = useState<number | null>(hue);
  const [saving, setSaving] = useState(false);
  const [replay, setReplay] = useState(0);

  const save = async (next: number | null) => {
    const previous = selected;
    setSelected(next);
    setReplay((token) => token + 1);
    setSaving(true);

    try {
      const res = await fetch(`/api/users/${username}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarHue: next }),
      });

      if (!res.ok) throw new Error('Failed to save avatar');

      onSaved(next);
      toast.success('Avatar updated');
    } catch {
      setSelected(previous);
      toast.error('Failed to update avatar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <DitherAvatar
        name={username}
        hue={selected ?? undefined}
        size={72}
        animate
        replayToken={replay}
        className="rounded-lg ring-1 ring-gray-800"
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-400">Avatar colour</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => save(null)}
            disabled={saving}
            title="Auto — derived from your username"
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${
              selected === null
                ? 'border-white bg-white/10 text-white'
                : 'border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Auto
          </button>

          {HUES.map((h) => {
            const isActive = selected === h;
            return (
              <button
                key={h}
                onClick={() => save(h)}
                disabled={saving}
                title={`Hue ${h}°`}
                style={{ backgroundColor: rgb(hueFill(h)) }}
                className={`flex h-7 w-7 items-center justify-center rounded-md ring-2 transition-transform hover:scale-110 disabled:opacity-50 ${
                  isActive ? 'ring-white' : 'ring-transparent'
                }`}
              >
                {isActive && <Check className="h-3.5 w-3.5 text-black" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
