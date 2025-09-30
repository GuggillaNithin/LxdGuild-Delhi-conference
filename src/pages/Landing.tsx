import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import { PosterCanvas } from '@/components/PosterCanvas';

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <img src={logo} alt="GITEX Global 2025" className="h-20 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            I'm Attending GITEX Global 2025 🎉
          </h1>
          <p className="text-xl text-muted-foreground">
            👥 787+ attendees already shared
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Preview */}
          <div className="flex items-center justify-center">
            <PosterCanvas
              name={formData.name || 'Your Name'}
              company={formData.company || 'Your Company'}
              headshotUrl={headshotPreview}
            />
          </div>

          {/* Form */}
          <div className="flex items-center">
            <Card className="w-full p-8 backdrop-blur-sm bg-card/95 shadow-xl border-2 border-primary/20">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="John Doe"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                    placeholder="Tech Corp"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="headshot">Your Headshot (Optional)</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="headshot"
                      className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer bg-muted/50"
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
                  <Label htmlFor="email">Registered Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="john@techcorp.com"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
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
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}