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

    const { email, password, role, name, phone, school_id, student_id } = await req.json()

    if (!email || !password || !role || !name || !school_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Create Auth Account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, school_id }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users?.users.find((u: any) => u.email === email)
        if (existingUser) {
          const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: existingUser.id,
            user_id: existingUser.id,
            name,
            email,
            phone,
            role,
            school_id,
            student_id,
            password,
            must_change_password: true
          })
          if (profileError) throw profileError
          return new Response(JSON.stringify({ success: true, user: existingUser, message: 'User already existed, profile updated' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
      throw authError
    }

    // 2. Create Profile Record
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      user_id: authData.user.id,
      name,
      email,
      phone,
      role,
      school_id,
      student_id,
      password,
      must_change_password: true
    })

    if (profileError) throw profileError

    return new Response(JSON.stringify({ success: true, user: authData.user }), {
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
