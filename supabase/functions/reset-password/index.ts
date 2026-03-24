import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { profileId, newPassword } = await req.json()

    if (!profileId || !newPassword) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Get the user_id from the profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, phone')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!profile.user_id) {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      const authUser = users.users.find((u: any) => 
        u.email === profile.email || 
        u.phone === profile.phone ||
        u.user_metadata?.phone === profile.phone
      );

      if (authUser) {
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
          authUser.id,
          { password: newPassword }
        );
        if (authUpdateError) throw authUpdateError;

        await supabaseAdmin.from('profiles').update({ user_id: authUser.id }).eq('id', profileId);
        
        return new Response(JSON.stringify({ success: true, message: 'Auth password updated and synced' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ error: 'User not found in Auth system. Please login normally to create your account.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Update Auth password directly
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.user_id,
      { password: newPassword }
    );
    if (authUpdateError) throw authUpdateError;

    return new Response(JSON.stringify({ success: true, message: 'Auth password updated' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
