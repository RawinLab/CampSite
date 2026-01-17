'use client';

import { useState } from 'react';
import { Share2, Facebook, Twitter, Link2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
  className?: string;
}

export function ShareButtons({ title, description, url, className }: ShareButtonsProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = description || title;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(tweetUrl, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', err);
      }
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      {/* Main Share Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleNativeShare}
        className={className}
        aria-label="Share"
      >
        <Share2 className="w-4 h-4" />
      </Button>

      {/* Share Dialog for non-native share */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share {title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Share Options */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="flex flex-col items-center gap-2 h-auto py-4 px-6"
                onClick={handleShareFacebook}
              >
                <Facebook className="w-6 h-6 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="flex flex-col items-center gap-2 h-auto py-4 px-6"
                onClick={handleShareTwitter}
              >
                <Twitter className="w-6 h-6 text-sky-500" />
                <span className="text-xs">Twitter</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="flex flex-col items-center gap-2 h-auto py-4 px-6"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="w-6 h-6 text-green-600" />
                ) : (
                  <Link2 className="w-6 h-6" />
                )}
                <span className="text-xs">{copied ? 'Copied!' : 'Copy Link'}</span>
              </Button>
            </div>

            {/* URL Preview */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm outline-none truncate"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Inline Share Buttons (for placement within content)
export function InlineShareButtons({ title, description, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = description || title;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Share:</span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
          window.open(fbUrl, '_blank', 'width=600,height=400');
        }}
        aria-label="Share on Facebook"
      >
        <Facebook className="w-4 h-4 text-blue-600" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          window.open(tweetUrl, '_blank', 'width=600,height=400');
        }}
        aria-label="Share on Twitter"
      >
        <Twitter className="w-4 h-4 text-sky-500" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopyLink}
        aria-label="Copy link"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Link2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
