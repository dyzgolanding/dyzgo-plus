const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '';
let key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
});

fetch(`${url}/functions/v1/send-ticket-email`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
  body: JSON.stringify({
    type: "UPDATE",
    record: { id: "test-123", status: "valid", event_id: "721a9a8f-2fbc-49ed-add6-816dcd1d6d84", guest_email: "test@test.com", guest_name: "Test User", qr_hash: "123" }
  })
}).then(async r => {
  console.log("Status:", r.status);
  console.log(await r.text());
}).catch(console.error);
