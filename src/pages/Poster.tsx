import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import { PosterCanvas } from '@/components/PosterCanvas';
import { supabase } from '@/integrations/supabase/client';

export default function Poster() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [attendee, setAttendee] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    // Fetch poster data from database
    const fetchPoster = async () => {
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching poster:', error);
        toast({
          title: "Poster not found",
          description: "This poster doesn't exist or has been removed.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setAttendee(data);
      setLoading(false);
    };

    fetchPoster();

    // Get user email from sessionStorage if available
    const storedData = sessionStorage.getItem('attendeeData');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      setUserEmail(parsed.email || '');
    }
  }, [id, navigate, toast]);

  // Update meta tags for better social sharing
  useEffect(() => {
    if (attendee) {
      const posterUrl = `${window.location.origin}/poster/${id}`;
      
      document.title = `${attendee.name} - LXDGuild Delhi Conference 2025`;
      
      // Update OG tags
      const updateMetaTag = (property: string, content: string) => {
        let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
        tag.content = content;
      };

      updateMetaTag('og:title', `${attendee.name} - LXDGuild Delhi Conference 2025`);
      updateMetaTag('og:description', `Join ${attendee.name} at India's Largest L&D Delhi Conference 2025!`);
      updateMetaTag('og:url', posterUrl);
      
      if (attendee.headshot_url) {
        updateMetaTag('og:image', attendee.headshot_url);
      }
    }
  }, [attendee, id]);

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

  const handleCopyText = async () => {
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

  const handleCopyLink = async () => {
    const posterLink = `${window.location.origin}/poster/${id}`;
    try {
      await navigator.clipboard.writeText(posterLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      
      toast({
        title: "Link Copied!",
        description: "Poster link copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleShare = async (platform: string) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const fileName = `lxdguild-delhi-2025-${attendee?.name?.replace(/\s+/g, '-').toLowerCase()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Try Web Share API first (works on mobile and some desktop browsers)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'LXDGuild Delhi Conference 2025',
            text: shareText,
            files: [file],
          });
          
          toast({
            title: "Shared successfully!",
            description: "Your poster has been shared.",
          });
          return;
        } catch (error: any) {
          // User cancelled or share failed, continue to fallback
          if (error.name !== 'AbortError') {
            console.error('Share failed:', error);
          }
        }
      }

      // Fallback: Download image and open platform share with text + link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      // Copy share text
      await navigator.clipboard.writeText(shareText);

      const encodedText = encodeURIComponent(shareText);
      const posterLink = encodeURIComponent(`${window.location.origin}/poster/${id}`);
      
      const urls: Record<string, string> = {
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${posterLink}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${posterLink}&quote=${encodedText}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}%0A%0A${posterLink}`,
        whatsapp: `https://wa.me/?text=${encodedText}%0A%0A${posterLink}`,
      };

      toast({
        title: "Image downloaded & text copied!",
        description: "Upload the downloaded image and paste the text in your post.",
        duration: 5000,
      });

      // Small delay to let user see the toast
      setTimeout(() => {
        if (urls[platform]) {
          window.open(urls[platform], '_blank', 'width=600,height=400');
        }
      }, 500);
    }, 'image/png');
  };

  const handleEdit = () => {
    // Check if user email matches poster owner
    if (userEmail && attendee && userEmail.toLowerCase() === attendee.email.toLowerCase()) {
      // Allow editing - redirect to home with pre-filled data
      sessionStorage.setItem('attendeeData', JSON.stringify(attendee));
      navigate('/');
    } else {
      // Redirect to event registration
      window.location.href = 'https://allevents.in/new-delhi/learning-without-limits-lxd-guild-delhi-instructional-designers-conference-2025-tickets/80008068595965';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading poster...</p>
        </div>
      </div>
    );
  }

  if (!attendee) {
    return null;
  }

  const isOwner = userEmail && attendee && userEmail.toLowerCase() === attendee.email.toLowerCase();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <img src={logo} alt="LXDGuild Delhi Conference 2025" className="h-20 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            🎊 Event Poster Ready! 🎊
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
              <h2 className="text-2xl font-bold mb-4 text-white">Share Your Poster</h2>
              
              <Button
                onClick={handleCopyLink}
                className="w-full h-12 mb-4"
                size="lg"
              >
                {linkCopied ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-5 w-5" />
                    Copy Poster Link
                  </>
                )}
              </Button>

              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full h-12 mb-4"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Poster
              </Button>

              {isOwner && (
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="w-full h-12"
                >
                  Edit Poster Details
                </Button>
              )}

              {!isOwner && (
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="w-full h-12"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Get Your Own Poster
                </Button>
              )}

              <div className="border-t border-white pt-4 mt-4">
                <h3 className="font-semibold mb-2 text-white">Share Content</h3>
                <p className="text-sm text-gray-300 mb-4 p-4 bg-white/5 rounded-lg whitespace-pre-line">
                  {shareText}
                </p>

                <Button
                  onClick={handleCopyText}
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
              <p className="text-sm text-gray-400 mb-4">
                Click to share your poster image with caption text
              </p>
              
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
              
              <p className="text-xs text-gray-500 mt-3">
                💡 On mobile: image + text shared directly. On desktop: image downloads + text copies for easy posting.
              </p>
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
