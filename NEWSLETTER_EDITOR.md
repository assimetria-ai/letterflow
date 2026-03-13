# Newsletter Editor - Implementation Guide

## Overview

A modern, feature-rich newsletter editor with Markdown support, built for LetterFlow. The editor provides a seamless writing experience with real-time preview, image upload, and auto-save functionality.

## Features Implemented

### ✅ Core Features

1. **Rich Markdown Editor**
   - Full Markdown syntax support
   - Toolbar with quick formatting buttons (Bold, Italic, Heading, Link, List, Quote, Code)
   - Syntax guide footer for quick reference
   - Auto-resizing textarea

2. **Image Upload**
   - Drag-and-drop file upload
   - URL-based image insertion
   - Upload progress indicator
   - File validation (type and size limits)
   - Automatic image insertion into Markdown content

3. **Preview Mode**
   - Three view modes: Edit, Split, Preview
   - Real-time HTML rendering from Markdown
   - Email-styled preview pane
   - Sanitized HTML output for security

4. **Auto-Save**
   - Automatic draft saving every 30 seconds
   - Manual save button
   - Save status indicator
   - Preserves both Markdown and HTML content

5. **Newsletter Management**
   - List view with filtering (All, Drafts, Published)
   - Create/Edit/Delete operations
   - Status badges (Draft, Scheduled, Published)
   - Responsive table layout

## Technical Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **marked** - Markdown to HTML conversion
- **DOMPurify** - HTML sanitization

### Backend
- **Express** - Node.js web framework
- **Prisma** - Database ORM
- **Multer** - File upload handling
- **PostgreSQL** - Database

## Project Structure

```
letterflow/
├── src/
│   ├── components/
│   │   ├── NewsletterEditor.jsx    # Main editor component
│   │   ├── MarkdownEditor.jsx      # Markdown editing pane
│   │   ├── ImageUploader.jsx       # Image upload modal
│   │   ├── PreviewPane.jsx         # HTML preview pane
│   │   └── NewsletterList.jsx      # Newsletter list view
│   ├── styles/
│   │   └── app.css                 # Global styles + prose
│   ├── App.jsx                     # Root component with routing
│   └── main.jsx                    # Entry point
├── server/
│   ├── routes/
│   │   ├── newsletters.js          # Newsletter CRUD endpoints
│   │   └── upload.js               # Image upload endpoint
│   └── index.js                    # Express server setup
├── @custom/
│   └── db/
│       └── schema.prisma           # Database schema
├── index.html                      # HTML entry point
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind configuration
└── package.json                    # Dependencies
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd products/letterflow
npm install
```

### 2. Configure Environment

Create `.env` file with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/letterflow"
PORT=3000
NODE_ENV=development
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 4. Start Development Servers

```bash
# Starts both frontend (Vite) and backend (Express) concurrently
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## API Endpoints

### Newsletters

```
GET    /api/newsletters           # List all newsletters
GET    /api/newsletters?status=draft  # Filter by status
GET    /api/newsletters/:id       # Get single newsletter
POST   /api/newsletters           # Create newsletter
PUT    /api/newsletters/:id       # Update newsletter
DELETE /api/newsletters/:id       # Delete newsletter
GET    /api/newsletters/:id/analytics  # Get analytics
```

### Upload

```
POST   /api/upload/image          # Upload image file
GET    /uploads/images/:filename  # Serve uploaded image
```

## Usage Guide

### Creating a Newsletter

1. Click "New Newsletter" button
2. Enter title and email subject
3. Write content in Markdown
4. Insert images using the "Insert Image" button
5. Toggle between Edit/Split/Preview modes
6. Save as draft or publish

### Markdown Formatting

- **Bold**: `**text**` or use toolbar button
- **Italic**: `*text*` or use toolbar button
- **Heading**: `## Heading` or use toolbar button
- **Link**: `[text](url)` or use toolbar button
- **List**: `- item` or use toolbar button
- **Quote**: `> quote` or use toolbar button
- **Code**: `` `code` `` or use toolbar button
- **Image**: `![alt](url)` or use image uploader

### Image Upload

**Method 1: File Upload**
1. Click "Insert Image"
2. Switch to "Upload File" tab
3. Click "Choose File" or drag & drop
4. Image is uploaded and inserted automatically

**Method 2: URL**
1. Click "Insert Image"
2. Stay on "Image URL" tab
3. Paste image URL
4. Click "Insert Image"

### View Modes

- **Edit**: Full-width Markdown editor
- **Split**: Side-by-side editor and preview
- **Preview**: Full-width email preview

### Auto-Save

- Automatically saves every 30 seconds
- Manual save with "Save Draft" button
- Status indicator shows "Saving..." during save

## Security Features

1. **HTML Sanitization**: DOMPurify cleans all HTML output
2. **File Upload Validation**: 
   - Allowed types: JPEG, PNG, GIF, WebP
   - Maximum size: 5MB
3. **SQL Injection Protection**: Prisma ORM parameterized queries
4. **XSS Protection**: Content sanitization before rendering

## Future Enhancements

### Potential Improvements

1. **Rich Text Editor Option**: Add WYSIWYG editor alongside Markdown
2. **Template Library**: Pre-built newsletter templates
3. **Email Testing**: Send test emails before publishing
4. **Responsive Preview**: Mobile/tablet preview modes
5. **Collaboration**: Real-time collaborative editing
6. **Version History**: Track and restore previous versions
7. **A/B Testing**: Test different subject lines and content
8. **Scheduling**: Advanced scheduling options
9. **Image Library**: Browse previously uploaded images
10. **Markdown Export/Import**: Save and load Markdown files

### Performance Optimizations

- Debounce auto-save to reduce API calls
- Lazy load preview rendering
- Implement virtual scrolling for large newsletters
- Add service worker for offline draft saving

## Troubleshooting

### Common Issues

**Issue**: "Failed to fetch newsletters"
- Check database connection in `.env`
- Ensure Prisma migrations are up to date
- Verify backend server is running

**Issue**: "Image upload failed"
- Check `uploads/images` directory exists and is writable
- Verify file size is under 5MB
- Ensure file type is supported

**Issue**: "Preview not updating"
- Check browser console for errors
- Verify Markdown syntax is valid
- Try refreshing the page

## Development Notes

### Code Quality

- ESLint configured for code quality
- Prettier for consistent formatting
- PropTypes for component validation (if added)

### Testing

To add tests:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Deployment

For production deployment:
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## Contributing

When adding features:
1. Follow existing code structure
2. Add appropriate error handling
3. Update this documentation
4. Test thoroughly in all view modes

## License

PROPRIETARY - LetterFlow Team
