import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { students, school_id } = await req.json()

    if (!students || !Array.isArray(students) || !school_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = { success: [] as any[], failed: [] as any[] }

    for (const student of students) {
      const { name, admission_number, class: className, gender, phone } = student
      const dummyEmail = `student_${admission_number.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.boraschool.ke`
      const password = 'password123'

      try {
        // 1. Create Auth Account
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: dummyEmail,
          password,
          email_confirm: true,
          user_metadata: { name, role: 'student', school_id }
        })

        let authUserId
        if (authError) {
          if (authError.message.includes('already registered')) {
            const { data: users } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = users?.users.find((u: any) => u.email === dummyEmail)
            if (existingUser) {
              authUserId = existingUser.id
            } else {
              throw authError
            }
          } else {
            throw authError
          }
        } else {
          authUserId = authData.user.id
        }

        // 2. Create Student Record
        const { data: studentData, error: studentError } = await supabaseAdmin.from('students').upsert({
          id: authUserId,
          name,
          admission_number,
          class: className,
          gender,
          school_id,
          status: 'Active'
        }).select().single()

        if (studentError) throw studentError

        // 3. Create Profile Record
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
          id: authUserId,
          user_id: authUserId,
          name,
          email: dummyEmail,
          phone: phone || null,
          role: 'student',
          school_id,
          student_id: studentData.id,
          password,
          must_change_password: true
        })

        if (profileError) throw profileError

        results.success.push({ id: authUserId, name, admission_number })
      } catch (err: any) {
        results.failed.push({ name, admission_number, error: err.message })
      }
    }

    return new Response(JSON.stringify(results), {
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
