import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { submitMission } from '../../services/missionService';

const URL_REGEX = /^https?:\/\/.+\..+/;
const NOTE_MAX = 200;

/**
 * SubmitMissionModal
 *
 * Props:
 *   assignment  – mission_assignment row (must have .id)
 *   open        – boolean
 *   onClose     – () => void
 *   onSuccess   – () => void  (refresh parent data)
 */
export default function SubmitMissionModal({ assignment, open, onClose, onSuccess }) {
  const [url, setUrl]     = useState('');
  const [note, setNote]   = useState('');
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState('');

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    if (urlError) setUrlError('');
  };

  const handleSubmit = async () => {
    if (!URL_REGEX.test(url.trim())) {
      setUrlError('Please enter a valid URL (e.g. https://github.com/...)');
      return;
    }

    setLoading(true);
    try {
      await submitMission(assignment.id, url.trim(), note.trim() || undefined);
      toast.success('Work submitted! Awaiting review.');
      setUrl('');
      setNote('');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.message ?? 'Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Submit Your Work</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Paste a link to your completed work. The company reviewer will check it and award XP.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* URL input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm md:text-xs font-semibold text-foreground/80 uppercase tracking-wide">
              Project URL <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="https://github.com/your-project"
              value={url}
              onChange={handleUrlChange}
              className="bg-[var(--va-surface)] border-[var(--va-border)] text-[var(--text-primary)] placeholder:text-muted-foreground focus:border-[var(--va-orange)]/50"
            />
            {urlError && (
              <p className="text-sm md:text-xs text-red-400">{urlError}</p>
            )}
          </div>

          {/* Note textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm md:text-xs font-semibold text-foreground/80 uppercase tracking-wide">
              Note to reviewer{' '}
              <span className="text-muted-foreground font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={NOTE_MAX}
              placeholder="Anything you want the reviewer to know..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-md bg-[color:color-mix(in_srgb,var(--text-primary)_5%,transparent)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-muted-foreground text-sm px-3 py-2 resize-none focus:outline-none focus:border-[var(--va-orange)]/50 transition-colors"
            />
            <p className="text-sm md:text-xs text-muted-foreground text-right">
              {note.length}/{NOTE_MAX}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="border-[var(--border)] text-foreground/80 hover:bg-[color:color-mix(in_srgb,var(--text-primary)_10%,transparent)] hover:text-[var(--text-primary)]"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !url.trim()}
            className="bg-orange-600 hover:bg-orange-600 text-[var(--text-primary)]"
          >
            {loading ? 'Submitting…' : 'Submit Work'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
