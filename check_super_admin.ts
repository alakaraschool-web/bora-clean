import { supabase } from './src/lib/supabase';

async function checkSuperAdmin() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1);
    
  if (error) {
    console.error('Error checking super admin:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Super admin already exists.');
  } else {
    console.log('No super admin found. Please register one.');
  }
}

checkSuperAdmin();
