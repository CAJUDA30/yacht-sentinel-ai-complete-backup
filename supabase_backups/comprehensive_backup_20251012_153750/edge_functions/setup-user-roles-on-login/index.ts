import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    // Create supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create client for the user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      throw new Error('Failed to get user from auth header')
    }

    console.log(`Setting up yacht-centric user roles for user: ${user.id} (${user.email})`)

    // Check if this is the superadmin user
    const isSuperadminUser = user.id === '6d201176-5be1-45d4-b09f-f70cb4ad38ac' || 
                           user.email === 'superadmin@yachtexcel.com'

    // First, check if user_roles table exists and create if needed
    const { data: tableExists, error: tableCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .limit(1)

    if (tableCheckError && tableCheckError.message.includes('does not exist')) {
      console.log('User roles table needs to be created via migrations')
    }

    // Check if user already has roles
    const { data: existingRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role, yacht_id, is_active')
      .eq('user_id', user.id)

    if (rolesError && !rolesError.message.includes('does not exist')) {
      throw new Error(`Failed to check existing roles: ${rolesError.message}`)
    }

    const hasActiveRoles = existingRoles && existingRoles.some(r => r.is_active)

    // If no active roles exist, assign default roles
    if (!hasActiveRoles) {
      if (isSuperadminUser) {
        // Assign global superadmin role (yacht_id = NULL)
        const { error: insertError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: user.id,
            yacht_id: null, // Global superadmin
            role: 'superadmin',
            created_by: user.id,
            is_active: true
          })
          .select()

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('Failed to insert superadmin role:', insertError)
          throw new Error(`Failed to assign superadmin role: ${insertError.message}`)
        }

        console.log('Successfully assigned global superadmin role')
      } else {
        // For regular users, we'll assign them to yachts as needed
        // For now, just log that they need yacht assignment
        console.log('Regular user registered - will need yacht assignment')
      }
    } else {
      // If superadmin user but doesn't have global superadmin role, add it
      if (isSuperadminUser && !existingRoles?.some(r => r.role === 'superadmin' && r.yacht_id === null && r.is_active)) {
        const { error: insertError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: user.id,
            yacht_id: null, // Global superadmin
            role: 'superadmin',
            created_by: user.id,
            is_active: true
          }, {
            onConflict: 'user_id,yacht_id,role'
          })

        if (insertError) {
          console.error('Failed to upsert global superadmin role:', insertError)
        } else {
          console.log('Successfully ensured global superadmin role')
        }
      }
    }

    // Get final user roles with yacht context
    const { data: finalRoles, error: finalError } = await supabaseAdmin
      .from('user_roles')
      .select('role, yacht_id, is_active, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (finalError) {
      throw new Error(`Failed to fetch final roles: ${finalError.message}`)
    }

    // Determine primary role and yacht context
    const roleHierarchy = { viewer: 0, user: 1, manager: 2, admin: 3, superadmin: 4 }
    const roles = finalRoles || []
    let primaryRole = 'user'
    let highestLevel = 0
    let isGlobalSuperAdmin = false
    let yachtRoles: Array<{yacht_id: string | null, role: string}> = []

    roles.forEach(roleRecord => {
      const level = roleHierarchy[roleRecord.role as keyof typeof roleHierarchy] || 0
      if (level > highestLevel) {
        highestLevel = level
        primaryRole = roleRecord.role
      }
      
      if (roleRecord.role === 'superadmin' && roleRecord.yacht_id === null) {
        isGlobalSuperAdmin = true
      }
      
      yachtRoles.push({
        yacht_id: roleRecord.yacht_id,
        role: roleRecord.role
      })
    })

    const result = {
      success: true,
      user_id: user.id,
      email: user.email,
      roles: roles.map(r => r.role),
      yacht_roles: yachtRoles,
      primary_role: primaryRole,
      is_superadmin: roles.some(r => r.role === 'superadmin'),
      is_global_superadmin: isGlobalSuperAdmin,
      message: `Yacht-centric user roles setup completed. Primary role: ${primaryRole}`
    }

    console.log('User roles setup result:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in setup-user-roles-on-login:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Failed to setup user roles'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})