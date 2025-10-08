import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PosterCanvas } from '@/components/PosterCanvas';
import logo from '@/assets/logo.png';
import { Helmet } from 'react-helmet-async';

export default function Share() {
  const { id } = useParams();
  const [attendee, setAttendee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoster = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setAttendee(data);
      }
      setLoading(false);
    };

    fetchPoster();
  }, [id]);

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
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Poster not found</h1>
          <p>This poster doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/share/${id}`;
  const shareText = `Excited to be part of India's Largest L&D Delhi Conference 2025, hosted by LXDGuild!

Join us in Delhi for an incredible gathering of learning & development leaders, innovators, and changemakers.

#LXDGuild #DelhiConference2025 #LearningAndDevelopment #LXD`;

  // Generate OG image URL from poster canvas
  const ogImageUrl = attendee.headshot_url || `${window.location.origin}/poster-background.jpg`;

  return (
    <>
      <Helmet>
        <title>{attendee.name ? `${attendee.name}'s Poster` : 'Event Poster'} - LXDGuild Delhi Conference 2025</title>
        <meta name="description" content={`${attendee.name || 'Attendee'} is attending India's Largest L&D Delhi Conference 2025`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={`${attendee.name}'s Poster - LXDGuild Delhi Conference 2025`} />
        <meta property="og:description" content={shareText} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1080" />
        <meta property="og:image:height" content="1080" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={shareUrl} />
        <meta property="twitter:title" content={`${attendee.name}'s Poster - LXDGuild Delhi Conference 2025`} />
        <meta property="twitter:description" content={shareText} />
        <meta property="twitter:image" content={ogImageUrl} />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <img src={logo} alt="LXDGuild Delhi Conference 2025" className="h-20 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {attendee.name}'s Event Poster
            </h1>
            <p className="text-xl text-gray-300">
              India's Largest L&D Delhi Conference 2025
            </p>
          </header>

          <div className="max-w-2xl mx-auto">
            <PosterCanvas
              name={attendee.name}
              company={attendee.company}
              headshotUrl={attendee.headshot_url}
            />
          </div>
        </div>
      </div>
    </>
  );
}
