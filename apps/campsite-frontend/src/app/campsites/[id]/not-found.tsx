import Link from 'next/link';
import { Tent, Search, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CampsiteNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center">
          <Tent className="w-12 h-12 text-muted-foreground" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Campsite Not Found</h1>
          <p className="text-muted-foreground">
            Sorry, the campsite you are looking for does not exist or may have been removed.
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-muted/50 rounded-lg p-4 text-left">
          <p className="text-sm font-medium mb-2">This might have happened because:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>The campsite has been removed or deactivated</li>
            <li>The URL is incorrect or outdated</li>
            <li>The campsite is pending approval</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/search">
              <Search className="w-4 h-4 mr-2" />
              Search Campsites
            </Link>
          </Button>
        </div>

        {/* Back Link */}
        <div>
          <Button variant="ghost" asChild>
            <Link href="javascript:history.back()">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
