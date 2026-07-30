'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { APP_VERSION, CHANGELOG } from '@/lib/changelog';

interface ChangelogDialogProps {
  /** Drive the dialog from outside — used by the mobile account menu. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Extra classes on the version badge, e.g. to hide it on small screens. */
  triggerClassName?: string;
}

/**
 * A small version badge next to the logo. Clicking it opens a plain-language
 * "What's new" dialog built from the CHANGELOG list. Pass open/onOpenChange to
 * open it from somewhere else, such as a menu item.
 */
export function ChangelogDialog({
  open: controlledOpen,
  onOpenChange,
  triggerClassName = '',
}: ChangelogDialogProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="What’s new"
          aria-label={`What’s new — version ${APP_VERSION}`}
          className={`shrink-0 rounded-full border border-gray-800 bg-[#111] px-2 py-0.5 text-xs font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-white ${triggerClassName}`}
        >
          v{APP_VERSION}
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] overflow-y-auto border-gray-800 bg-[#111] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="h-5 w-5 text-gray-400" />
            What’s new
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {CHANGELOG.map((entry) => (
            <div key={entry.version}>
              <div className="mb-2 flex flex-wrap items-baseline gap-2">
                <h3 className="text-lg font-semibold text-white">
                  Version {entry.version}
                </h3>
                {entry.title && (
                  <span className="text-sm text-gray-300">{entry.title}</span>
                )}
                {entry.latest && (
                  <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-400">
                    Latest
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-500">
                  {entry.date}
                </span>
              </div>

              <ul className="space-y-1.5">
                {entry.changes.map((change, index) => (
                  <li
                    key={index}
                    className="flex gap-2 text-sm text-gray-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-600" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
