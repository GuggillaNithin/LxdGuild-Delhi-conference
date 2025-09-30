import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, Ticket } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function Tickets() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <img src={logo} alt="GITEX Global 2025" className="h-20 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Not Registered Yet?
          </h1>
        </header>

        <Card className="max-w-2xl mx-auto p-12 text-center backdrop-blur-sm bg-card/95 shadow-2xl border-2 border-primary/20">
          <div className="mb-8">
            <Ticket className="h-24 w-24 mx-auto text-primary mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Join us at GITEX Global 2025!
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              The world's largest Tech & AI show
            </p>
            <p className="text-muted-foreground">
              Get your ticket now to create your personalized event poster and be part of the biggest tech event of the year.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-semibold"
              onClick={() => window.open('https://tickets.event.com', '_blank')}
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Get Your Tickets Now
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => window.history.back()}
            >
              ← Back to Poster Creator
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Already registered?{' '}
              <a href="/" className="text-primary hover:underline font-semibold">
                Create your poster
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}