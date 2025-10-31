# Qalin Sara Invoice Generator

A web-based invoice generator designed specifically for flooring products (carpet, tiles, etc.). Create professional invoices with automatic calculations for area-based pricing.

## Features

- ✅ **Flooring-specific fields**: Artikel, Fläche (m²), €/m², Gesamt (€)
- ✅ **Automatic calculations**: Total amount calculated from area × price per m²
- ✅ **PDF export**: Generate professional PDF invoices
- ✅ **Auto-save**: Draft invoices automatically saved to browser localStorage
- ✅ **Invoice numbering**: Automatic sequential invoice numbering (YYYY-MM-XXX format)
- ✅ **Responsive design**: Works on desktop and mobile devices
- ✅ **No server required**: Runs entirely in the browser

## File Structure

```
Qalin-Sara-Invoice-Generator/
├── index.html          # Main HTML file
├── app.js              # Application logic
├── logo.png            # Company logo (required)
└── README.md           # This file
```

## Deployment

This is a static web application that can be deployed to any web hosting service.

### Quick Deploy Options

#### Option 1: GitHub Pages
1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to Settings → Pages
4. Select source branch (usually `main`)
5. Your site will be available at `https://yourusername.github.io/repository-name`

#### Option 2: Netlify
1. Drag and drop the entire folder to [Netlify Drop](https://app.netlify.com/drop)
2. Your site will be live instantly with a random URL
3. (Optional) Connect to a Git repository for automatic deployments

#### Option 3: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts

#### Option 4: Traditional Web Hosting
1. Upload all files via FTP/SFTP to your web server
2. Ensure files are in the root directory or a subdirectory
3. Access via your domain name

### Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for CDN resources: Tailwind CSS, pdfmake)
- `logo.png` file must be present in the same directory as `index.html`

## Usage

1. **Open** `index.html` in a web browser
2. **Fill in** invoice details:
   - Invoice number (auto-generated if left empty)
   - Invoice date and service date
   - Customer information
   - Items with article name, area (m²), and price per m²
3. **Add items** using the "Position hinzufügen" button
4. **Review** the total amount
5. **Generate PDF** by clicking "PDF erstellen"
6. **Download** the PDF invoice

### Invoice Numbering

The system automatically generates invoice numbers in the format `YYYY-MM-XXX`:
- `YYYY-MM` is derived from the invoice date
- `XXX` is a sequential 3-digit number (001, 002, etc.)
- Numbers reset each month

Example: `2024-01-001`, `2024-01-002`, etc.

### Settings

Click "Einstellungen" to configure:
- **USt-IdNr. / Steuernummer**: Optional tax ID number (appears on PDF invoices)

## Technical Details

- **Frontend**: Vanilla JavaScript (no frameworks)
- **Styling**: Tailwind CSS (via CDN)
- **PDF Generation**: pdfmake.js (via CDN)
- **Storage**: Browser localStorage (no backend required)
- **Language**: German (Deutsch)

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ Internet Explorer (not supported)

## Customization

### Changing Company Information

Edit the hardcoded company details in `index.html` (line ~54-57) and `app.js`:
- Search for "Qalin Sara"
- Search for "Industriestraße 17"
- Update with your company information

### Changing Logo

Replace `logo.png` with your own logo file (same filename). Supported formats: PNG, JPG, GIF.

### Styling

The app uses Tailwind CSS. Modify colors in the `tailwind.config` section of `index.html` (line ~10-18).

## Troubleshooting

### Logo not displaying
- Ensure `logo.png` exists in the same directory as `index.html`
- Check browser console for any errors
- Verify file permissions

### PDF not generating
- Check browser console for errors
- Ensure internet connection is active (CDN resources required)
- Try a different browser

### Data not saving
- Check if localStorage is enabled in your browser
- Try clearing browser cache and reloading

## License

This project is provided as-is for use by Qalin Sara.

## Support

For issues or questions, please contact the development team.

