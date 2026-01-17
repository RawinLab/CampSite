'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface InquiryReplyFormProps {
  inquiryId: string;
}

export function InquiryReplyForm({ inquiryId }: InquiryReplyFormProps) {
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reply.trim().length < 10) {
      toast({
        title: 'Error',
        description: 'Reply must be at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/dashboard/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reply: reply.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reply');
      }

      toast({
        title: 'Reply sent',
        description: 'Your reply has been sent to the guest via email',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reply to Inquiry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Write your reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
            maxLength={2000}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {reply.length}/2000 characters
            </span>
            <Button type="submit" disabled={isSubmitting || reply.trim().length < 10}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
