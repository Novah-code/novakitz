# NovaKitz Lifetime Access - Gumroad Product Setup

## Product Configuration

### Basic Settings
- **Product Name**: NovaKitz Lifetime - Early Believer Pass
- **Product Type**: Digital Product (License Key)
- **Price**: $129
- **Inventory Limit**: 200 units
- **Original Price Display**: ~~$199~~ $129 (Save $70!)

### Product Description (Copy & Paste)

```
🚀 Product Hunt Launch Special - Limited to 200 Early Believers

☀️ NOVAKITZ LIFETIME ACCESS
Regular Price: $199
Launch Price: $129 (Save $70!)

✨ What You Get Forever:
• 200 AI dream interpretations per month
• Unlimited dream journaling & full history access
• Monthly AI dream pattern reports
• Jungian archetype personality test & analysis
• All future premium features included
• Early Believer badge in the app

⚡ Why This Exists:
I'm a solo developer building NovaKitz. This lifetime offer helps fund server costs, AI API expenses, and continued development. Your support means everything and keeps this project alive.

🎯 Only 200 spots available - once they're gone, they're gone forever
💰 One-time payment, no monthly fees ever
🔑 Instant activation with license key
🌟 Join the founding members who believed first

---

📋 Refund Policy:
Since this is a digital license key with instant access and supports the project's survival, all sales are final. Please try the free version first (7 AI interpretations/month) at novakitz.com to ensure NovaKitz is right for you.

Made with care by an indie developer who believes in dreams.
```

### Gumroad Settings Checklist

1. **Pricing**
   - [x] Set price to $129
   - [x] Enable "Show original price" → Enter $199
   - [x] This creates the crossed-out effect

2. **Inventory**
   - [x] Enable "Limit quantity"
   - [x] Set to 200 units
   - [x] Enable "Show remaining quantity" for FOMO

3. **License Keys**
   - [x] Enable "Generate unique license keys"
   - [x] Set prefix: `NOVA-LIFETIME-`
   - [x] Key format: `NOVA-LIFETIME-XXXX-XXXX-XXXX`

4. **Delivery**
   - [x] Enable "Instant delivery"
   - [x] Add purchase confirmation email with activation instructions

5. **Webhook Integration**
   - [x] Set webhook URL: `https://your-domain.com/api/gumroad/webhook`
   - [x] Enable events: `sale`, `refund`, `dispute`

## Purchase Confirmation Email Template

**Subject**: Welcome to NovaKitz Lifetime - Your License Key Inside 🌟

**Body**:
```
Hey [buyer_name],

Welcome to the NovaKitz family! 🎉

You're one of the 200 Early Believers who made this project possible. Thank you for your support.

🔑 YOUR LIFETIME LICENSE KEY:
[license_key]

📱 ACTIVATE YOUR ACCOUNT:
1. Open NovaKitz app or visit novakitz.com
2. Go to Settings → Subscription
3. Enter your license key
4. Enjoy unlimited premium features forever!

✨ WHAT YOU NOW HAVE:
• 200 AI dream interpretations per month
• Unlimited dream history
• Monthly dream pattern reports
• Archetype personality analysis
• All future premium features
• Early Believer badge

Questions? Reply to this email - I read every message.

Dream on,
[Your Name]
Solo Developer, NovaKitz

P.S. You can find your license key anytime at: gumroad.com/library
```

## Marketing Copy for Launch

### Product Hunt Post Title
"NovaKitz - AI Dream Journal with Jungian Psychology 🌙"

### Product Hunt Description
```
Turn your dreams into insights with AI-powered interpretation and Jungian archetype analysis.

🌟 Product Hunt Special: Lifetime Access
Regular $199 → Launch Price $129 (200 spots only)

What makes NovaKitz different:
• Combines modern AI with Carl Jung's dream psychology
• Monthly pattern reports reveal your subconscious themes
• Archetype test maps your personality through dream symbols
• Beautiful, private dream journal with unlimited history

Built by a solo developer who believes everyone's dreams matter.

Try free (7 AI interpretations/month) or grab lifetime access while spots last.
```

### Twitter/X Launch Thread
```
🧵 I'm launching NovaKitz on Product Hunt today

After 6 months of solo development, my AI dream journal is live

Here's why I built it (and why 200 early believers can get lifetime access for $129)

👇

1/ I've kept a dream journal for years but never understood the patterns

Modern apps just store text. Psychology books are too dense.

I wanted something that bridges both worlds.

2/ NovaKitz uses AI + Jungian psychology to:
• Interpret dream symbols
• Track recurring themes
• Map your archetype personality
• Generate monthly insight reports

It's like having a dream analyst in your pocket.

3/ As a solo dev, server costs + AI API fees add up fast

So I'm offering 200 Lifetime passes: $129 (normally $199)

One payment. Forever access. All future features.

This funds the project and you get a founding member badge.

4/ If you've ever wondered:
• "Why do I keep having this dream?"
• "What does this symbol mean?"
• "What patterns am I missing?"

Try the free plan (7 AI interpretations/month) or grab lifetime:

[Link to Product Hunt]
[Link to Gumroad]

200 spots. That's it.
```

## Revenue Projection

**If 200 spots sell at $129:**
- Total Revenue: $25,800
- Stripe/Gumroad fees (10%): -$2,580
- **Net Revenue: $23,220**

**Server Cost Coverage:**
- Supabase Pro: ~$25/month
- OpenAI API: ~$100/month (estimated)
- Domain + misc: ~$25/month
- **Total monthly: ~$150**

**Runway**: $23,220 ÷ $150 = **154 months (12+ years)** of server costs covered

Plus ongoing monthly subscriptions ($4.99) for additional revenue.

## Technical Integration TODO

1. **Create Gumroad webhook endpoint**: `/app/api/gumroad/webhook/route.ts`
2. **Handle license key activation**: Update user subscription to premium with `expires_at = NULL`
3. **Add Early Believer badge**: New column in users table or metadata field
4. **Create activation UI**: Settings page with license key input
5. **Add validation**: Check license key against Gumroad API

## Launch Day Checklist

- [ ] Create Gumroad product with all settings above
- [ ] Test license key generation
- [ ] Set up webhook endpoint
- [ ] Test full purchase → activation flow
- [ ] Prepare Product Hunt post (draft + screenshots)
- [ ] Schedule Twitter/X thread
- [ ] Email existing users about launch
- [ ] Set up analytics to track conversions
- [ ] Monitor sales and respond to questions quickly

## Post-Launch

- Update remaining spots count regularly on social media
- Share milestone updates (50 sold, 100 sold, etc.)
- Thank early believers publicly
- Close sale at exactly 200 units - no extensions
- Consider future limited releases for special occasions

---

**Note**: Once you hit 200 sales, immediately disable the Gumroad product. Scarcity only works if you actually stick to the limit.
