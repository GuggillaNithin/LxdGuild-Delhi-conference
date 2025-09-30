import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Copy, Check, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import { PosterCanvas } from '@/components/PosterCanvas';

export default function Poster() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [attendee, setAttendee] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('attendeeData');
    if (!data) {
      navigate('/');
      return;
    }
    setAttendee(JSON.parse(data));
  }, [navigate]);

  const shareText = `Excited to be part of India's Largest L&D Delhi Conference 2025, hosted by LXDGuild!

Join us in Delhi for an incredible gathering of learning & development leaders, innovators, and changemakers.

#LXDGuild #DelhiConference2025 #LearningAndDevelopment #LXD`;

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `lxdguild-delhi-2025-${attendee?.name?.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Poster downloaded!",
        description: "Your poster has been saved to your device.",
      });
    }, 'image/png');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const urls: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (!attendee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <img src={logo} alt="LXDGuild Delhi Conference 2025" className="h-20 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            🎊 Your Event Poster is Ready! 🎊
          </h1>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Poster Preview */}
          <div className="flex items-center justify-center">
            <PosterCanvas
              name={attendee.name}
              company={attendee.company}
              headshotUrl={attendee.headshot_url}
            />
          </div>

          {/* Actions */}
          <div className="space-y-6">
            <Card className="p-6 bg-black border-2 border-white">
              <h2 className="text-2xl font-bold mb-4 text-white">Download & Share</h2>
              
              <Button
                onClick={handleDownload}
                className="w-full h-12 mb-4"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Poster
              </Button>

              <div className="border-t border-white pt-4 mt-4">
                <h3 className="font-semibold mb-2 text-white">Share Content</h3>
                <p className="text-sm text-gray-300 mb-4 p-4 bg-white/5 rounded-lg whitespace-pre-line">
                  {shareText}
                </p>

                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full mb-4"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Content
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-black border-2 border-white">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-white">
                <Share2 className="h-5 w-5" />
                Share on Social Media
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleShare('linkedin')}
                  variant="outline"
                  className="bg-[#0A66C2] hover:bg-[#004182] text-white border-0"
                >
                  LinkedIn
                </Button>
                <Button
                  onClick={() => handleShare('facebook')}
                  variant="outline"
                  className="bg-[#1877F2] hover:bg-[#0C63D4] text-white border-0"
                >
                  Facebook
                </Button>
                <Button
                  onClick={() => handleShare('twitter')}
                  variant="outline"
                  className="bg-[#000000] hover:bg-[#1a1a1a] text-white border-0"
                >
                  X (Twitter)
                </Button>
                <Button
                  onClick={() => handleShare('whatsapp')}
                  variant="outline"
                  className="bg-[#25D366] hover:bg-[#1DA851] text-white border-0"
                >
                  WhatsApp
                </Button>
              </div>
            </Card>

            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="w-full"
            >
              ← Create Another Poster
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}