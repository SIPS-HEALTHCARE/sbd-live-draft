import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

export async function verifyUserAndFacility(supabaseUrl: string, supabaseServiceKey: string, authHeader: string) {
    if (!authHeader) throw new Error('Unauthorized: Missing Auth Header');
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) throw new Error(`Unauthorized: Invalid or expired session (${authError?.message || 'No user found'})`);

    const userId = user.id;
    const userEmail = user.email || 'ES256_Auth_User';

    const { data: profile } = await supabase.from('sbd_portal_users')
        .select('*')
        .eq('auth_uid', userId)
        .single();

    let isAuthorized = false;
    let facilityTier = 'base';
    let customFacilityDirective = '';

    if (profile?.role === 'master_admin') {
        isAuthorized = true;
        facilityTier = 'supreme';
    } else if (profile?.facility_id) {
        // 1. Check Facility-Level Master Toggle
        const { data: access } = await supabase.from('david_facility_access')
            .select('is_active, tier, custom_directive')
            .eq('facility_id', profile.facility_id)
            .single();

        if (access && access.is_active) {
            // 2. Check Granular User-Level Toggle
            const { data: userAccess } = await supabase.from('david_user_access')
                .select('is_active')
                .eq('user_id', profile.id)
                .eq('facility_id', profile.facility_id)
                .single();

            if (userAccess && userAccess.is_active) {
                isAuthorized = true;
                facilityTier = access.tier;
                if (access.custom_directive) {
                    customFacilityDirective = "\\n[FACILITY MASTER DIRECTIVE]\\n" + access.custom_directive + "\\n";
                }
            } else {
                console.log(`[DAVID] Access blocked for user ${profile.id} at facility ${profile.facility_id}: Individual user access is disabled.`);
            }
        } else {
            console.log(`[DAVID] Access blocked for user ${profile.id}: Facility ${profile.facility_id} is globally disabled.`);
        }
    }

    if (!isAuthorized) {
        throw new Error('DAVID Intelligence is currently locked for this facility.');
    }

    return { userId, userEmail, profile, facilityTier, customFacilityDirective, supabase };
}
