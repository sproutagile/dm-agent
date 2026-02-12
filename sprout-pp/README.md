# Sprout AI - Browser Extension Sidebar

An AI-powered sidebar extension built with Plasmo, React, and Tailwind CSS featuring Shadow DOM isolation and streaming AI responses.

## 🚀 Features

- **Click-to-Open Sidebar**: Click the extension icon to toggle the sidebar
- **Background Service Worker**: Handles extension icon clicks and messaging
- **Shadow DOM Isolation**: Complete style encapsulation using Plasmo's Shadow DOM
- **Tailwind CSS with Prefix**: All classes prefixed with `sprout-` to avoid conflicts
- **Mock AI Streaming**: Word-by-word response simulation with `.ai-response-stream` class
- **Smooth Animations**: 200ms transform-based slide transitions
- **Chat Interface**: Clean UI with user/AI message bubbles
- **Summarize Highlight**: Quick action to summarize selected text

## 📁 Project Structure

```
sprout-pp/
├── assets/
│   └── icon.svg              # Extension icon (needs PNG conversion)
├── components/
│   ├── Header.tsx            # Sidebar header with close button
│   ├── MessageItem.tsx       # Individual message bubble
│   ├── MessageList.tsx       # Scrollable message container
│   ├── ChatInput.tsx         # Input area with send/summarize buttons
│   └── Sidebar.tsx           # Main sidebar component
├── contents/
│   └── sidebar.tsx           # Plasmo content script with Shadow DOM
├── lib/
│   ├── mock-ai.ts            # Mock AI streaming logic
│   └── utils.ts              # Utility functions
├── styles/
│   └── sidebar.css           # Shadow DOM styles
├── background.ts             # Service worker for icon clicks
├── package.json
├── tailwind.config.js        # Tailwind with sprout- prefix
└── tsconfig.json
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Icon File (REQUIRED)

**The extension needs a PNG icon to build successfully.** You have two options:

#### Option A: Convert the SVG (Recommended)
Convert `assets/icon.svg` to `assets/icon.png` using an online tool or ImageMagick:

```bash
# Using ImageMagick (if installed)
magick convert assets/icon.svg -resize 512x512 assets/icon.png

# Or use an online converter like:
# - https://cloudconvert.com/svg-to-png
# - https://convertio.co/svg-png/
```

#### Option B: Use Any PNG Icon
Place any 512x512 PNG icon at `assets/icon.png`. Plasmo will automatically generate all required sizes (16, 32, 48, 64, 128).

### 3. Run Development Server

```bash
npm run dev
```

This will:
- Generate icon assets in `.plasmo/gen-assets/`
- Build the extension in `build/chrome-mv3-dev/`
- Watch for file changes

### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `build/chrome-mv3-dev` directory

### 5. Test the Extension

- Navigate to any website
- **Click the extension icon** in the Chrome toolbar to open the sidebar
- Try sending messages to see the AI streaming effect
- Click "Summarize Highlight" after selecting text
- Click the X button to see the slide-out animation
- Click the extension icon again to re-open the sidebar

## 🎨 Key Technical Details

### Shadow DOM Setup

The sidebar is injected into a Shadow DOM with ID `extension-sidebar-root`:

```typescript
export const getShadowHostId = () => "extension-sidebar-root"
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}
```

### Click-to-Open Functionality

**Background Service Worker** (`background.ts`):
```typescript
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "OPEN_SIDEBAR" })
  }
})
```

**Content Script** (`contents/sidebar.tsx`):
- Listens for `OPEN_SIDEBAR` message from background script
- Uses `transform: translateX()` for smooth 200ms slide animations
- Default state: `isOpen = false` (sidebar hidden)
- Click extension icon → sidebar slides in
- Click X button → sidebar slides out

### Tailwind Prefix

All Tailwind classes use the `sprout-` prefix to avoid conflicts:

```javascript
// tailwind.config.js
module.exports = {
  prefix: 'sprout-',
  // ...
}
```

### AI Streaming

The mock AI uses an async generator to simulate word-by-word streaming:

```typescript
for await (const chunk of simulateAIResponse(content)) {
  aiContent += chunk
  // Update message with streaming class
}
```

The `.ai-response-stream` CSS class is applied during streaming for visual feedback.

### Animations

- **Slide-in**: 200ms ease-out when sidebar opens
- **Slide-out**: 200ms ease-in when sidebar closes
- **Typing indicator**: Subtle pulse animation during AI responses

## 🔧 Build for Production

```bash
npm run build
```

The production build will be in `build/chrome-mv3-prod/`.

## 📝 Development Notes

- **Style Isolation**: All styles are scoped to the Shadow DOM
- **No Host Page Conflicts**: The `sprout-` prefix ensures Tailwind classes don't clash
- **Auto-scroll**: Message list automatically scrolls to the latest message
- **Responsive**: Textarea auto-resizes up to 4 lines

## 🐛 Troubleshooting

### Icon Generation Error

If you see "Cannot load icon.png":
1. Ensure `assets/icon.png` exists
2. File must be PNG format (not SVG)
3. Recommended size: 512x512 or larger

### Styles Not Applying

1. Check that all classes use `sprout-` prefix
2. Verify `getStyle()` is injecting styles into Shadow DOM
3. Inspect Shadow Root in DevTools

### Sidebar Not Appearing

1. Check browser console for errors
2. Verify content script is injected (check DevTools > Sources)
3. Ensure `matches: ["<all_urls>"]` in content script config

## 📚 Tech Stack

- **Framework**: Plasmo (Browser Extension Framework)
- **UI**: React 18
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Build**: TypeScript, PostCSS

## 🎯 Next Steps

- [ ] Convert SVG icon to PNG
- [ ] Test on multiple websites
- [ ] Add real AI integration (replace mock)
- [ ] Implement persistent chat history
- [ ] Add keyboard shortcuts
- [ ] Create options page for settings

## 📄 License

MIT
