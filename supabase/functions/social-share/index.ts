import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { posterId, platform, imageData, caption } = await req.json();

    if (!posterId || !platform || !imageData || !caption) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${platform} share for user ${user.id}, poster ${posterId}`);

    // Get social connection
    const { data: connection, error: connError } = await supabaseClient
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .maybeSingle();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ 
          error: 'Not connected', 
          needsAuth: true,
          message: `Please connect your ${platform} account first` 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check token expiration
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          error: 'Token expired', 
          needsAuth: true,
          message: 'Your connection has expired. Please reconnect your account.' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Platform-specific posting
    if (platform === 'linkedin') {
      const result = await postToLinkedIn(connection.access_token, imageData, caption);
      return new Response(
        JSON.stringify({ success: true, postUrl: result.postUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add more platforms here (twitter, facebook, etc.)
    
    return new Response(
      JSON.stringify({ error: `Platform ${platform} not yet supported` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Social share error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function postToLinkedIn(accessToken: string, imageBase64: string, caption: string) {
  console.log('Posting to LinkedIn...');

  // Get user URN
  const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!userInfoResponse.ok) {
    throw new Error('Failed to fetch LinkedIn user info');
  }

  const userInfo = await userInfoResponse.json();
  const personUrn = `urn:li:person:${userInfo.sub}`;

  // Step 1: Register image upload
  const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: personUrn,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    }),
  });

  if (!registerResponse.ok) {
    const error = await registerResponse.text();
    console.error('LinkedIn asset registration failed:', error);
    throw new Error('Failed to register image upload');
  }

  const registerData = await registerResponse.json();
  const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const assetUrn = registerData.value.asset;

  console.log('Image upload registered, uploading...');

  // Step 2: Upload image binary
  const imageBuffer = Uint8Array.from(atob(imageBase64.split(',')[1]), c => c.charCodeAt(0));
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'image/png',
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to LinkedIn');
  }

  console.log('Image uploaded, creating post...');

  // Step 3: Create post with image
  const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: caption,
          },
          shareMediaCategory: 'IMAGE',
          media: [{
            status: 'READY',
            media: assetUrn,
          }],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  });

  if (!postResponse.ok) {
    const error = await postResponse.text();
    console.error('LinkedIn post creation failed:', error);
    throw new Error('Failed to create LinkedIn post');
  }

  const postData = await postResponse.json();
  console.log('LinkedIn post created successfully');

  return {
    postUrl: `https://www.linkedin.com/feed/update/${postData.id}`,
  };
}
