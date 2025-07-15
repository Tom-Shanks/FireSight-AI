# FireSight AI - GitHub Pages Setup

This document outlines the GitHub Pages configuration for the FireSight AI project.

## 🚀 Live Site

The FireSight AI GitHub Pages site is deployed at: `https://tom-shanks.github.io/FireSight-AI/`

**Status**: ✅ **LIVE AND WORKING**

## 📁 Project Structure

```
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # JavaScript functionality
├── 404.html            # Custom 404 page
├── favicon.svg         # Site favicon
├── sw.js              # Service worker for PWA
├── manifest.json       # Web app manifest
├── robots.txt          # SEO robots file (auto-generated)
├── sitemap.xml         # SEO sitemap (auto-generated)
├── .github/
│   └── workflows/
│       └── pages.yml   # GitHub Actions workflow
└── GITHUB_PAGES_README.md
```

## 🔧 Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The workflow will automatically deploy on pushes to the main branch

### 2. Configure Repository Settings

Ensure your repository has the following settings:

- **Public repository** (required for GitHub Pages on free accounts)
- **Actions enabled** in repository settings
- **Pages permissions** set to allow GitHub Actions

### 3. Workflow Configuration

The GitHub Actions workflow (`.github/workflows/pages.yml`) automatically:

- Triggers on pushes to `main` or `master` branches
- Copies necessary files to the build directory
- Generates SEO files (robots.txt, sitemap.xml)
- Deploys to GitHub Pages
- Provides manual deployment option via workflow_dispatch

## 🎨 Site Features

### Modern Design
- Responsive layout that works on all devices
- Professional gradient backgrounds
- Smooth animations and transitions
- Modern typography using Inter font
- Fire-themed color scheme

### Interactive Elements
- Mobile-responsive navigation
- Smooth scrolling between sections
- Contact form with validation
- Hover effects on cards and buttons
- Notification system for user feedback

### Sections
- **Hero Section**: Main landing with call-to-action
- **Features**: Key capabilities of FireSight AI
- **Demo**: Placeholder for interactive demonstration
- **Documentation**: Links to project documentation
- **Contact**: Contact form and information

## 🛠️ Customization

### Updating Content

1. **HTML Content**: Edit `index.html` to update text, links, and structure
2. **Styling**: Modify `styles.css` for visual changes
3. **Functionality**: Update `script.js` for interactive features

### Adding New Sections

1. Add HTML structure in `index.html`
2. Add corresponding styles in `styles.css`
3. Add any interactive functionality in `script.js`
4. Update navigation menu if needed

### Changing Colors

The site uses a fire-themed color palette:
- Primary: `#ff6b35` (Fire Orange)
- Secondary: `#e74c3c` (Red)
- Gradients: Various combinations of blues, purples, and oranges

Update CSS variables or color values throughout `styles.css` to change the theme.

## 📱 Mobile Responsiveness

The site includes comprehensive mobile responsiveness:

- **Navigation**: Hamburger menu for mobile devices
- **Grid Layouts**: Responsive grid systems that adapt to screen size
- **Typography**: Scalable font sizes
- **Buttons**: Touch-friendly button sizes
- **Forms**: Mobile-optimized form inputs

## 🔄 Deployment Process

### Automatic Deployment

1. Push changes to the `main` or `master` branch
2. GitHub Actions workflow automatically triggers
3. Site builds and deploys to GitHub Pages
4. Changes are live within minutes

### Manual Deployment

1. Go to Actions tab in your repository
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Choose branch and run

## 🐛 Troubleshooting

### Common Issues

1. **Site not updating**: Check Actions tab for failed deployments
2. **404 errors**: Ensure all file paths are correct and files exist
3. **Mobile navigation not working**: Check JavaScript console for errors
4. **Styling issues**: Verify CSS file is properly linked

### Debugging Steps

1. Check GitHub Actions workflow logs
2. Verify repository settings
3. Test locally by opening `index.html` in browser
4. Check browser console for JavaScript errors

## 📈 Performance Optimization

The site includes several performance optimizations:

- **CDN Resources**: External resources loaded from CDN
- **Optimized Images**: Placeholder system for future image optimization
- **Minimal Dependencies**: Only essential external libraries
- **Efficient CSS**: Optimized selectors and minimal redundancy
- **SEO Files**: Auto-generated robots.txt and sitemap.xml

## 🔐 Security Considerations

- All external resources loaded over HTTPS
- Form validation on client-side (server-side validation recommended for production)
- No sensitive data exposed in client-side code
- CORS considerations for any future API integrations

## 🚀 Future Enhancements

### Planned Features

1. **Interactive Demo**: Live demonstration of FireSight AI capabilities
2. **Blog Section**: News and updates about the project
3. **API Documentation**: Interactive API explorer
4. **Team Page**: Information about the development team
5. **Case Studies**: Real-world applications and results

### Technical Improvements

1. **Progressive Web App (PWA)**: Offline functionality
2. **Performance Monitoring**: Real user monitoring
3. **SEO Optimization**: Enhanced meta tags and structured data
4. **Accessibility**: WCAG compliance improvements

## 📞 Support

For issues with the GitHub Pages setup:

1. Check the [GitHub Pages documentation](https://docs.github.com/en/pages)
2. Review the [GitHub Actions documentation](https://docs.github.com/en/actions)
3. Open an issue in the repository
4. Contact the development team

## 📝 License

This GitHub Pages setup is part of the FireSight AI project and follows the same MIT license terms.

## 🧹 Recent Cleanup

**Latest Update**: December 2024
- ✅ Removed redundant workflow files (deploy.yml, production-workflow.yml, medium-workflow.yml, simple-test.yml)
- ✅ Optimized pages.yml workflow with SEO improvements
- ✅ Added auto-generation of robots.txt and sitemap.xml
- ✅ Ensured all essential files are properly deployed
- ✅ Verified site is live and accessible

---

**Last Updated**: December 2024
**Version**: 1.1.0