import supabase from './config/supabase';

async function testSupabase(): Promise<void> {
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .limit(1);

  // Handle error
  if (error) {
    console.error('Error fetching data from Supabase:', error.message);
    return;  // Exit if there's an error
  }

  // Log data
  if (data && data.length > 0) {
    console.log('Supabase Data:', data);
  } else {
    console.log('No data found in the "apps" table.');
  }
}

testSupabase();
