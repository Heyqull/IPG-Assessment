$token = "supersecrettoken123"
$url = "http://localhost:3000/api/leads/incoming"
$headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" }

$leads = @(
  @{ leadId="LD2001"; name="Ahmad Razif";    phone="0111234567"; email="ahmad.razif@email.com";   source="Facebook Ads";  project="Residensi Mutiara";  budget=550000; message="Interested in 2-bedroom";         createdAt="2026-04-01T08:00:00Z" }
  @{ leadId="LD2002"; name="Siti Nora";      phone="0122345678"; email="siti.nora@email.com";      source="Instagram";     project="Taman Harmoni";      budget=420000; message="Looking for ground floor unit";    createdAt="2026-04-02T09:15:00Z" }
  @{ leadId="LD2003"; name="Lim Wei Jian";   phone="0133456789"; email="lim.weijian@email.com";    source="Google Ads";    project="Skyline Residences"; budget=780000; message="Need 3-bedroom with parking";      createdAt="2026-04-05T10:30:00Z" }
  @{ leadId="LD2004"; name="Priya Devi";     phone="0144567890"; email="priya.devi@email.com";      source="Referral";      project="Residensi Mutiara";  budget=600000; message="Referred by friend";               createdAt="2026-04-07T11:00:00Z" }
  @{ leadId="LD2005"; name="Mohd Hafiz";     phone="0155678901"; email="mohd.hafiz@email.com";      source="Walk-in";       project="Taman Harmoni";      budget=390000; message="Wants to view show unit";          createdAt="2026-04-08T14:00:00Z" }
  @{ leadId="LD2006"; name="Tan Mei Ling";   phone="0166789012"; email="tan.meiling@email.com";     source="Facebook Ads";  project="Skyline Residences"; budget=850000; message="Investment unit preferred";        createdAt="2026-04-10T09:00:00Z" }
  @{ leadId="LD2007"; name="Raj Kumar";      phone="0177890123"; email="raj.kumar@email.com";       source="PropertyGuru";  project="Residensi Mutiara";  budget=500000; message="First-time buyer, needs financing"; createdAt="2026-04-12T13:30:00Z" }
  @{ leadId="LD2008"; name="Nurul Ain";      phone="0188901234"; email="nurul.ain@email.com";        source="Instagram";     project="Taman Harmoni";      budget=430000; message="Prefers corner lot";               createdAt="2026-04-14T10:00:00Z" }
  @{ leadId="LD2009"; name="Kevin Chong";    phone="0199012345"; email="kevin.chong@email.com";     source="Google Ads";    project="Skyline Residences"; budget=920000; message="High floor unit only";             createdAt="2026-04-16T15:00:00Z" }
  @{ leadId="LD2010"; name="Farah Liyana";   phone="0110123456"; email="farah.liyana@email.com";    source="Referral";      project="Residensi Mutiara";  budget=570000; message="Needs storage room";               createdAt="2026-04-18T08:45:00Z" }
)

foreach ($lead in $leads) {
  $body = $lead | ConvertTo-Json
  try {
    $res = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "OK  $($lead.leadId) $($lead.name)"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "ERR $($lead.leadId) $($lead.name) - $status"
  }
}
