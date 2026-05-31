// NOTE: safe for both Next.js server + client

interface DonationEmailData {
  id?: string;
  foodName?: string;
  description?: string;
  quantity?: string | number;
  pickupLocation?: string;
  pickupTime?: string;
  expiresAt?: string;
}

interface RestaurantEmailData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function getDonationNotificationHtml(
    donation: DonationEmailData,
    restaurant: RestaurantEmailData
): string {

  let expiryText = "Not specified";

  if (donation.expiresAt) {
    try {
      expiryText = new Date(
          donation.expiresAt
      ).toLocaleString("en-US",{
        weekday:"long",
        year:"numeric",
        month:"long",
        day:"numeric",
        hour:"2-digit",
        minute:"2-digit",
      });
    } catch {
      expiryText = donation.expiresAt;
    }
  }

  const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL
          ? `https://${process.env.NEXT_PUBLIC_SITE_URL.replace(
              /^https?:\/\//,
              ""
          )}`
          : "http://localhost:3000";


  const donationUrl =
      donation.id
          ? `${baseUrl}/donations/${donation.id}?utm_source=email&utm_medium=notification&utm_campaign=donation_alert`
          : `${baseUrl}/donations`;


  const contactParts:string[]=[];

  if(restaurant.phone)
    contactParts.push(restaurant.phone);

  if(restaurant.email)
    contactParts.push(restaurant.email);

  if(restaurant.address)
    contactParts.push(restaurant.address);

  const contactInfo=
      contactParts.length>0
          ?contactParts.join(" · ")
          :"Contact via EcoPlate";



  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1.0"
/>

<title>New Donation Available</title>

<style>

body{
margin:0;
padding:0;
background:#0f172a;
font-family:
Segoe UI,
Arial,
sans-serif;
color:#fff;
}

table{
border-collapse:collapse;
}

.email-wrapper{
padding:30px 15px;
background:#0f172a;
}

.email-container{
max-width:650px;
margin:auto;
background:#1e293b;
border-radius:22px;
overflow:hidden;
border:1px solid #334155;
}


/* Header */

.header{
padding:50px 30px;
text-align:center;

background:
linear-gradient(
135deg,
#047857,
#10b981,
#34d399
);
}

.badge{
display:inline-block;
padding:8px 14px;
background:rgba(255,255,255,.15);
border:1px solid rgba(255,255,255,.2);
border-radius:999px;
font-size:11px;
font-weight:700;
letter-spacing:.18em;
margin-bottom:18px;
}

.header-logo{
font-size:14px;
font-weight:800;
letter-spacing:.25em;
margin-bottom:14px;
}

.header h1{
margin:0;
font-size:32px;
line-height:1.2;
}

.header-sub{
margin-top:10px;
font-size:14px;
opacity:.9;
}


/* Body */

.body-content{
padding:35px;
}

.intro-text{
font-size:16px;
line-height:1.9;
color:#CBD5E1;
margin-bottom:30px;
}


/* Stats */

.stats-table{
width:100%;
margin-bottom:30px;
border-spacing:10px;
}

.stat-card{

background:#0f172a;
border:1px solid #334155;
border-radius:14px;
padding:18px;
text-align:center;

}

.stat-label{
font-size:10px;
text-transform:uppercase;
color:#64748b;
font-weight:700;
margin-bottom:10px;
}

.stat-value{
font-size:14px;
font-weight:700;
color:#e2e8f0;
line-height:1.5;
}

.warning{
color:#fbbf24;
}


/* Donation card */

.donation-card{
background:#0f172a;
border:1px solid #334155;
padding:24px;
border-radius:16px;
}

.card-title{
font-size:20px;
font-weight:800;
color:#10B981;
margin-bottom:22px;
}

.description-box{
background:#172033;
padding:18px;
border-radius:10px;
line-height:1.8;
color:#CBD5E1;
}

.divider{
height:1px;
background:#1e293b;
margin:18px 0;
}

.field-label{

font-size:11px;
letter-spacing:.1em;
font-weight:700;
text-transform:uppercase;
color:#64748b;

margin-bottom:6px;
}

.field-value{

font-size:15px;
line-height:1.7;
color:#E2E8F0;

}


/* Warning */

.alert-box{

margin-top:25px;
padding:16px;
border-radius:14px;

background:
rgba(245,158,11,.12);

border-left:
4px solid #f59e0b;

color:#fde68a;

line-height:1.8;

}


/* CTA */

.cta-section{

padding:0 35px 35px;
text-align:center;

}

.cta-button{

display:inline-block;

padding:16px 35px;

background:
linear-gradient(
135deg,
#059669,
#10b981
);

color:white !important;
text-decoration:none;
border-radius:12px;

font-weight:800;
font-size:16px;

box-shadow:
0 6px 30px
rgba(
16,
185,
129,
.4
);

}

.secondary-link{

margin-top:18px;
font-size:12px;
line-height:1.7;
color:#64748b;
word-break:break-all;

}


/* Footer */

.footer{

background:#0f172a;

border-top:
1px solid #334155;

padding:30px;

text-align:center;

}

.footer p{

font-size:12px;
line-height:1.8;
color:#64748b;

margin:0 0 8px;

}


@media(max-width:600px){

.body-content,
.footer,
.cta-section{

padding-left:20px!important;
padding-right:20px!important;

}

.stats-table td{

display:block;
width:100%;
padding-bottom:12px;

}

}

</style>

</head>

<body>

<div class="email-wrapper">

<div class="email-container">

<div class="header">

<div class="badge">

NEW DONATION

</div>

<div class="header-logo">

🌿 EcoPlate

</div>

<h1>

Food Donation Available

</h1>

<div class="header-sub">

Help reduce food waste and support your community

</div>

</div>



<div class="body-content">

<p class="intro-text">

Hello Charity Partner 👋

<br><br>

<strong>

${escapeHtml(
      restaurant.name ??
      "A Restaurant"
  )}

</strong>

has posted a new food donation.

Eligible organizations can request it before expiration.

</p>


<table class="stats-table">

<tr>

<td>

<div class="stat-card">

<div class="stat-label">

Available

</div>

<div class="stat-value">

🍱 ${escapeHtml(
      String(
          donation.quantity ??
          "N/A"
      )
  )}

</div>

</div>

</td>



<td>

<div class="stat-card">

<div class="stat-label">

Pickup

</div>

<div class="stat-value">

📍 ${escapeHtml(
      donation.pickupLocation ??
      "Pending"
  )}

</div>

</div>

</td>


<td>

<div class="stat-card">

<div class="stat-label">

Expires

</div>

<div class="stat-value warning">

⏰ ${escapeHtml(expiryText)}

</div>

</div>

</td>

</tr>

</table>



<div class="donation-card">

<div class="card-title">

🍽 ${escapeHtml(
      donation.foodName ??
      "Food Donation"
  )}

</div>


<div class="description-box">

${escapeHtml(
      donation.description ??
      "No details provided"
  )}

</div>


<div class="divider"></div>

<div class="field-label">

Pickup Time

</div>

<div class="field-value">

🕐 ${escapeHtml(
      donation.pickupTime ??
      "Contact Restaurant"
  )}

</div>


<div class="divider"></div>

<div class="field-label">

Restaurant

</div>

<div class="field-value">

✅ Verified Restaurant

<br>

${escapeHtml(
      restaurant.name ??
      "N/A"
  )}

</div>


<div class="divider"></div>

<div class="field-label">

Contact Information

</div>

<div class="field-value">

${escapeHtml(contactInfo)}

</div>

</div>


<div class="alert-box">

⚡ Donation inventory can disappear quickly. Request before another organization claims it.

</div>

</div>



<div class="cta-section">

<a
href="${donationUrl}"
class="cta-button"
>

View Donation →

</a>


<div class="secondary-link">

or copy:

<br><br>

${donationUrl}

</div>

</div>



<div class="footer">

<p>

🌍 Fighting Food Waste Together

</p>

<p>

You received this because your organization is an approved EcoPlate charity partner.

</p>

<p>

EcoPlate Automated Notification Service

</p>

</div>

</div>

</div>

</body>

</html>

`;
}


function escapeHtml(
    str:string
):string{

  return str
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");

}