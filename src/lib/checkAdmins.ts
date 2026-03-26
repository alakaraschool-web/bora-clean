import { supabase } from '../lib/supabase';

export const checkSchema = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (error) console.error('Error fetching schema:', error);
  else console.log('Profiles schema:', data);
};
