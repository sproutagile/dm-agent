# Build Fix Guide - Sprout AI Sidebar

## ✅ Verification Complete

I've verified all critical components. Here's the status:

### 1. Tailwind Config ✅ **VERIFIED**
**File:** `tailwind.config.js`

All MCP color tokens are properly configured:
- ✅ **Kangkong** (50-950): Primary green palette
- ✅ **Mushroom** (50-950): Neutral grays
- ✅ **White** (50-950): White/light palette
- ✅ **Tomato** (50-950): Error/danger palette
- ✅ **Prefix**: `sprout-` is set
- ✅ **Content paths**: `./contents/**/*.{ts,tsx}` and `./components/**/*.{ts,tsx}`

### 2. Shadow DOM Injection ✅ **VERIFIED**
**File:** `contents/sidebar.tsx`

```typescript
export const getShadowHostId = () => "extension-sidebar-root"

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText  // Injects sidebar.css with MCP tokens
    return style
}
```

✅ Styles are properly injected into Shadow DOM

### 3. Message Passing ✅ **VERIFIED**
**Background → Content Script**

- **Background** (`background.ts`): Sends `{ action: "OPEN_SIDEBAR" }`
- **Content Script** (`sidebar.tsx`): Listens for `"OPEN_SIDEBAR"`
- ✅ Action strings match perfectly

### 4. Z-Index ✅ **FIXED**
**File:** `contents/sidebar.tsx`

- **Before:** `sprout-z-[999999]`
- **After:** `sprout-z-[2147483647]` ← Maximum z-index value

This ensures the sidebar appears above ALL host page elements.

---

## 🔧 Clean Build Commands

Run these commands in order to rebuild the extension with MCP styles:

### Option 1: Full Clean Rebuild (Recommended)

```powershell
# 1. Stop any running dev server (Ctrl+C if running)

# 2. Clean Plasmo cache and build artifacts
Remove-Item -Recurse -Force .plasmo, build -ErrorAction SilentlyContinue

# 3. Clean node_modules cache (optional but recommended)
npm cache clean --force

# 4. Rebuild the extension
npm run dev
```

### Option 2: Quick Rebuild

```powershell
# 1. Stop dev server (Ctrl+C)

# 2. Clean build directory only
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue

# 3. Rebuild
npm run dev
```

### Option 3: Nuclear Option (If above doesn't work)

```powershell
# 1. Remove everything
Remove-Item -Recurse -Force .plasmo, build, node_modules -ErrorAction SilentlyContinue

# 2. Reinstall dependencies
npm install

# 3. Rebuild
npm run dev
```

---

## 📦 Loading the Extension

After running the build commands:

1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer Mode** (toggle in top-right)
3. **Remove old extension** if already loaded
4. **Click "Load unpacked"**
5. **Select folder:** `c:\xampp\htdocs\sprout-pp\build\chrome-mv3-dev`
6. **Verify** the extension icon appears in the toolbar

---

## 🎨 Testing MCP Styles

Once loaded, test the following:

### Header
- [ ] Background is **Kangkong Green** (#22C558)
- [ ] Text is **white**
- [ ] "Sprout AI" title is visible
- [ ] Close button (X) is white

### Buttons
- [ ] Send button is **Kangkong Green**
- [ ] Summarize button turns **Kangkong Green** on hover
- [ ] Hover transitions are smooth (200ms)

### Messages
- [ ] User messages have **Kangkong Green** background
- [ ] AI messages have **light gray** (mushroom-100) background
- [ ] Text is readable with proper contrast

### Input
- [ ] Border is **gray** (mushroom-300)
- [ ] Focus ring is **Kangkong Green**
- [ ] Scrollbar is hidden
- [ ] Cannot manually resize

---

## 🐛 Troubleshooting

### Problem: Old UI still showing

**Solution:**
1. Hard refresh the test page: `Ctrl+Shift+R`
2. Reload extension: Click reload icon in `chrome://extensions/`
3. Clear browser cache
4. Try incognito mode

### Problem: Sidebar not appearing

**Solution:**
1. Check console for errors: `F12` → Console tab
2. Verify content script loaded: Look for "extension-sidebar-root" in Elements tab
3. Check if message is being sent: Add `console.log` in background.ts

### Problem: Styles not applying

**Solution:**
1. Verify Shadow DOM: Inspect element → Should see `#shadow-root (open)`
2. Check if styles are injected: Look for `<style>` tag inside shadow root
3. Rebuild with clean cache (Option 1 above)

### Problem: Z-index issues

**Solution:**
- Already fixed! Z-index is now `2147483647` (maximum value)
- If still hidden, check host page's z-index in DevTools

---

## ✅ Expected Result

After following this guide, you should see:

1. **Vibrant Kangkong Green header** (#22C558)
2. **White text** on green backgrounds
3. **Smooth hover effects** on buttons
4. **Proper message bubble colors** (green for user, gray for AI)
5. **Sidebar appears on top** of all page content

---

## 📝 Summary of Changes Made

| File | Change | Status |
|------|--------|--------|
| `tailwind.config.js` | Added MCP color palettes | ✅ Complete |
| `styles/sidebar.css` | Updated CSS variables | ✅ Complete |
| `components/Header.tsx` | Applied kangkong-500 | ✅ Complete |
| `components/ChatInput.tsx` | Applied MCP tokens | ✅ Complete |
| `components/MessageItem.tsx` | Applied MCP colors | ✅ Complete |
| `components/MessageList.tsx` | Applied MCP tokens | ✅ Complete |
| `contents/sidebar.tsx` | Updated z-index to max | ✅ Just Fixed |

---

## 🚀 Next Steps

1. Run the **Full Clean Rebuild** commands above
2. Load the extension in Chrome
3. Navigate to any website
4. Click the extension icon
5. **Verify** the Kangkong green design appears!

If you still see the old UI after following all steps, let me know and I'll help debug further.
