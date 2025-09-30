import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import { PosterCanvas } from '@/components/PosterCanvas';

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showEditOverlay, setShowEditOverlay] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
  });
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeadshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeadshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check email
      const { data: emailCheck } = await supabase.functions.invoke('check-email', {
        body: { email: formData.email },
      });

      if (!emailCheck.registered) {
        toast({
          title: "Email not registered",
          description: "Please register for the event first.",
          variant: "destructive",
        });
        navigate('/tickets');
        return;
      }

      // Upload headshot if provided
      let headshotUrl = emailCheck.attendee?.headshot_url || '';
      if (headshotFile) {
        const fileExt = headshotFile.name.split('.').pop();
        const fileName = `${formData.email}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('headshots')
          .upload(fileName, headshotFile, {
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('headshots')
          .getPublicUrl(fileName);
        
        headshotUrl = publicUrl;
      }

      // Update attendee
      await supabase.functions.invoke('update-attendee', {
        body: {
          email: formData.email,
          name: formData.name,
          company: formData.company,
          headshot_url: headshotUrl,
        },
      });

      // Store in sessionStorage and navigate
      sessionStorage.setItem('attendeeData', JSON.stringify({
        ...formData,
        headshot_url: headshotUrl,
      }));

      setShowEditOverlay(false);
      navigate('/poster');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to process your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-16">
          <img src={logo} alt="LXDGuild" className="h-20 mx-auto mb-8" />
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            India's Largest<br />
            L&D<br />
            Delhi Conference 2025
          </h1>
        </header>

        {/* Poster Display with Edit Button */}
        <div className="max-w-xl mx-auto relative">
          <PosterCanvas
            name={formData.name || 'Your Name'}
            company={formData.company || 'Your Company'}
            headshotUrl={headshotPreview}
          />
          
          {/* Edit Button positioned to the right */}
          <div className="absolute top-1/2 -right-4 md:-right-20 transform -translate-y-1/2">
            <Button
              onClick={() => setShowEditOverlay(true)}
              size="lg"
              className="rounded-full"
            >
              Edit Details
            </Button>
          </div>
        </div>

        {/* Edit Overlay */}
        {showEditOverlay && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
              {/* Dimmed Poster Preview */}
              <div className="opacity-40 hidden md:block">
                <PosterCanvas
                  name={formData.name || 'Your Name'}
                  company={formData.company || 'Your Company'}
                  headshotUrl={headshotPreview}
                />
              </div>

              {/* Form Panel */}
              <div className="bg-black border-2 border-white rounded-lg p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Edit Your Details</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEditOverlay(false)}
                    className="hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-white">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="John Doe"
                      className="mt-2 bg-black border-white text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company" className="text-white">Company Name *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                      placeholder="Your Company"
                      className="mt-2 bg-black border-white text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="headshot" className="text-white">Your Headshot (Optional)</Label>
                    <div className="mt-2">
                      <label
                        htmlFor="headshot"
                        className="flex items-center justify-center gap-2 border-2 border-white border-dashed rounded-lg p-6 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Upload className="h-5 w-5" />
                        <span className="text-sm">
                          {headshotFile ? headshotFile.name : 'Click to upload'}
                        </span>
                      </label>
                      <Input
                        id="headshot"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-white">Registered Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="john@company.com"
                      className="mt-2 bg-black border-white text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Use the email you registered with
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-lg font-semibold"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Email & Continue'
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
