import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const { websiteId, userId } = await req.json()

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get website details
    const { data: website, error: websiteError } = await supabaseClient
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .single()

    if (websiteError || !website) {
      throw new Error('Website not found')
    }

    // Verify user has permission to deploy
    const { data: permission, error: permissionError } = await supabaseClient.rpc('user_can_publish_website', {
      user_uuid: userId,
      website_uuid: websiteId
    })

    if (permissionError || !permission) {
      throw new Error('You do not have permission to deploy this website')
    }

    // Get latest published version
    const { data: latestVersion, error: versionError } = await supabaseClient
      .from('website_versions')
      .select('*')
      .eq('website_id', websiteId)
      .eq('is_published', true)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError && versionError.code !== 'PGRST116') {
      throw new Error('Failed to get website version')
    }

    if (!latestVersion) {
      throw new Error('No published version found')
    }

    // Create deployment record
    const { data: deployment, error: deploymentError } = await supabaseClient
      .from('website_deployments')
      .insert({
        website_id: websiteId,
        version_id: latestVersion.id,
        status: 'in_progress',
        deployed_by: userId,
        custom_domain: website.domain
      })
      .select()
      .single()

    if (deploymentError) {
      throw new Error('Failed to create deployment record')
    }

    // In a real implementation, this would trigger a build process
    // For demo purposes, we'll simulate a successful deployment
    setTimeout(async () => {
      try {
        // Update deployment status
        await supabaseClient
          .from('website_deployments')
          .update({
            status: 'completed',
            deployment_url: website.domain 
              ? `https://${website.domain}` 
              : `https://${website.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${websiteId.substring(0, 8)}.ncbx.app`
          })
          .eq('id', deployment.id)
      } catch (err) {
        console.error('Error updating deployment status:', err)
      }
    }, 3000)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Deployment started',
        deploymentId: deployment.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error deploying website:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})