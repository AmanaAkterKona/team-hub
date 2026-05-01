'use client';
import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-24">
      <Command className="w-[560px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border">
        <Command.Input placeholder="Search or navigate..." className="w-full p-4 text-sm outline-none" />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Item onSelect={() => { router.push('/dashboard'); setOpen(false); }}>
            Go to Dashboard
          </Command.Item>
          <Command.Item onSelect={() => { router.push('/goals/new'); setOpen(false); }}>
            Create new goal
          </Command.Item>
          <Command.Item onSelect={() => { router.push('/analytics'); setOpen(false); }}>
            View analytics
          </Command.Item>
        </Command.List>
      </Command>
    </div>
  );
}