import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialConnection {
  platform: string;
  connected: boolean;
  username?: string;
}

export function SocialConnections() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<SocialConnection[]>([
    { platform: 'linkedin', connected: false },
    { platform: 'twitter', connected: false },
    { platform: 'facebook', connected: false },
  ]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('social_connections')
      .select('platform, platform_username');

    if (error) {
      console.error('Error fetching connections:', error);
      return;
    }

    setConnections(prev => prev.map(conn => {
      const existingConn = data?.find(d => d.platform === conn.platform);
      return existingConn ? {
        ...conn,
        connected: true,
        username: existingConn.platform_username,
      } : conn;
    }));
  };

  const handleConnect = async (platform: string) => {
    setLoading(platform);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to connect social accounts",
        variant: "destructive",
      });
      setLoading(null);
      return;
    }

    if (platform === 'linkedin') {
      // Get environment variables - these would be set in your backend
      const clientId = 'YOUR_LINKEDIN_CLIENT_ID'; // This should come from backend
      const redirectUri = `${window.location.origin}/api/linkedin-oauth`;
      const state = btoa(JSON.stringify({ userId: user.id }));
      
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=openid profile email w_member_social`;

      // Open OAuth in popup
      const popup = window.open(authUrl, 'LinkedIn Auth', 'width=600,height=700');
      
      // Listen for OAuth callback
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          setLoading(null);
          fetchConnections();
        }
      }, 500);
    }

    // Add other platforms here
  };

  const handleDisconnect = async (platform: string) => {
    const { error } = await supabase
      .from('social_connections')
      .delete()
      .eq('platform', platform as 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'whatsapp_business');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Disconnected",
      description: `${platform} account has been disconnected`,
    });

    fetchConnections();
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      linkedin: 'LinkedIn',
      twitter: 'X (Twitter)',
      facebook: 'Facebook',
    };
    return names[platform] || platform;
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Connected Accounts</h2>
      <p className="text-muted-foreground mb-6">
        Connect your social media accounts to enable one-click posting with images
      </p>

      <div className="space-y-4">
        {connections.map(conn => (
          <div
            key={conn.platform}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-semibold">{getPlatformName(conn.platform)}</h3>
                {conn.connected && conn.username && (
                  <p className="text-sm text-muted-foreground">
                    Connected as {conn.username}
                  </p>
                )}
              </div>
              {conn.connected ? (
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <X className="h-3 w-3" />
                  Not Connected
                </Badge>
              )}
            </div>

            {conn.connected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(conn.platform)}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleConnect(conn.platform)}
                disabled={loading === conn.platform}
              >
                {loading === conn.platform ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> If you haven't connected your accounts, the app will use
          native sharing on mobile devices or download the poster + open share dialogs on desktop.
        </p>
      </div>
    </Card>
  );
}
