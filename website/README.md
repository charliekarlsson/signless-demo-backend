# SignLess Website

Beautiful, modern landing page for the SignLess project - showcasing passwordless Solana wallet authentication.

## 🎨 Design Features

- **Modern Fintech Aesthetic**: Sleek gradients, smooth animations, professional typography
- **Crypto Vibes**: Purple/cyan gradient theme inspired by blockchain UI
- **Fully Responsive**: Mobile-first design that looks great on all devices
- **Interactive Elements**: Tab switching, smooth scrolling, copy-to-clipboard
- **SEO Optimized**: Proper meta tags, semantic HTML, fast loading

## 📁 Files

```
website/
├── index.html          # Main landing page
├── styles.css          # All styles (variables, components, responsive)
├── script.js           # Interactive functionality
└── README.md          # This file
```

## 🚀 Quick Start

### Option 1: Open Locally

Simply open `index.html` in your browser:

```powershell
# Open with default browser
start index.html

# Or use a local server
python -m http.server 8000
# Then visit http://localhost:8000
```

### Option 2: Deploy to GitHub Pages (Free!)

1. **Create a new repository**:
   ```powershell
   cd website
   git init
   git add .
   git commit -m "Initial website"
   ```

2. **Push to GitHub**:
   ```powershell
   # Create repo on GitHub first, then:
   git remote add origin https://github.com/yourusername/solana-auth-website.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "main" branch and "/" root
   - Click "Save"
   - Your site will be live at: `https://yourusername.github.io/solana-auth-website/`

### Option 3: Deploy to Netlify (Free!)

1. **Drag & Drop**:
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag the `website` folder
   - Done! Get instant URL

2. **Via GitHub**:
   - Push code to GitHub (see Option 2)
   - Connect Netlify to your GitHub repo
   - Auto-deploys on every commit

### Option 4: Deploy to Vercel (Free!)

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
cd website
vercel

# Follow prompts, get instant URL
```

## 🎯 Customization

### Update Your Info

Edit `index.html` and replace:

- `yourusername` → Your GitHub username
- `yourdomain.com` → Your domain/service URL
- `contact@yourdomain.com` → Your email
- Social media links

### Change Colors

Edit `styles.css` variables:

```css
:root {
    --purple-primary: #8B5CF6;  /* Main brand color */
    --cyan-primary: #06B6D4;    /* Accent color */
    /* ... more colors ... */
}
```

### Add Your Logo

Replace the emoji icon in the navigation:

```html
<span class="logo-icon">⚡</span>
<!-- Replace with: -->
<img src="your-logo.png" alt="Logo" class="logo-icon">
```

### Update Code Examples

Edit the code blocks in `index.html` to show your actual API endpoints:

```html
<pre><code>https://YOUR-API-URL.com/api/auth/initiate</code></pre>
```

## 📊 Sections Overview

| Section | Purpose |
|---------|---------|
| **Hero** | Eye-catching intro with CTA buttons |
| **Features** | 6 key benefits of your auth system |
| **How It Works** | 3-step process visualization |
| **Code Examples** | Copy-paste integration snippets |
| **Pricing** | Self-hosted (free) vs hosted plans |
| **Use Cases** | Where developers can use this |
| **CTA** | Final call-to-action |
| **Footer** | Links and social media |

## 🎨 Design System

### Colors
- **Background**: Dark navy (`#0F0F1E`, `#0A0A14`)
- **Cards**: Slightly lighter (`#1A1A2E`)
- **Primary**: Purple gradient (`#8B5CF6 → #06B6D4`)
- **Text**: White with gray variations

### Typography
- **Display**: Space Grotesk (headers)
- **Body**: Inter (paragraphs)
- **Code**: Courier New (code blocks)

### Spacing
- Uses consistent spacing scale (0.5rem → 6rem)
- Responsive breakpoints at 768px

## 📱 Mobile Optimization

The site is fully responsive with:
- Collapsible navigation menu
- Stacked layouts on mobile
- Touch-friendly buttons
- Optimized font sizes

## ⚡ Performance

- **Lazy loading**: Images load on scroll
- **Intersection Observer**: Animations trigger on view
- **Minimal dependencies**: Pure vanilla JS
- **Optimized CSS**: Single file, well-organized

## 🔧 Advanced Customization

### Add Live Demo Section

Create a demo page and link it:

```html
<section id="demo" class="demo-section">
    <iframe src="./demo.html" width="100%" height="600px"></iframe>
</section>
```

### Add Analytics

Add before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-GA-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-GA-ID');
</script>
```

### Add Contact Form

Use services like:
- [Formspree](https://formspree.io/) (free)
- [Netlify Forms](https://www.netlify.com/products/forms/) (free)
- [Form.io](https://form.io/) (free tier)

### Custom Domain

**GitHub Pages**:
1. Buy domain (Namecheap, Google Domains)
2. Add CNAME record pointing to `yourusername.github.io`
3. Add `CNAME` file to your repo with your domain

**Netlify/Vercel**:
- Both offer easy custom domain setup in dashboard

## 🎁 Free Hosting Recommendations

| Service | Free Tier | Best For |
|---------|-----------|----------|
| **GitHub Pages** | Unlimited | Simple, integrated with repo |
| **Netlify** | 100GB/month | Auto-deploys, easy setup |
| **Vercel** | Unlimited bandwidth | Fast, great DX |
| **Cloudflare Pages** | Unlimited | Fast global CDN |

## 🐛 Troubleshooting

**Links not working?**
- Check that your GitHub/hosting URLs are correct
- Update all instances of `yourusername` and `yourdomain.com`

**Code not copying?**
- Ensure you're on HTTPS (clipboard API requirement)
- Or use localhost for development

**Styles not loading?**
- Check file paths are correct
- Ensure `styles.css` and `script.js` are in same folder as `index.html`

## 📄 License

Same as parent project - MIT License

## 🤝 Contributing

Want to improve the website?

1. Fork the repo
2. Make your changes
3. Submit a pull request

Ideas:
- Add dark/light mode toggle
- More code examples
- Interactive demo
- Blog section
- Customer testimonials

## 📞 Support

Questions? Open an issue on GitHub or reach out via:
- Email: contact@yourdomain.com
- Twitter: @yourusername
- Discord: Your community link

---

Built with ❤️ for the Solana ecosystem
