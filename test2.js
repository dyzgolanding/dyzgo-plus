const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '';
let key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(2);
  console.log("LAST TICKETS:", data, error);
  
  if (data && data.length > 0) {
    const ticket = data[0];
    const res = await fetch(`${url}/functions/v1/send-ticket-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        type: "UPDATE",
        record: ticket
      })
    });
    console.log("EDGE FUNCTION STATUS:", res.status);
    console.log("BODY:", await res.text());
  }
}

main();
