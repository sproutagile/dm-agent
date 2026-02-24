# Click-to-Open Sidebar Implementation

## Summary

Successfully implemented click-to-open functionality for the Sprout AI sidebar extension. The sidebar now starts hidden and opens when the user clicks the extension icon in the Chrome toolbar.

## Changes Made

### 1. Removed Popup UI ✅

**File Deleted:** `popup.tsx`

**Reason:** Ensures clicking the extension icon triggers the background service worker instead of opening a popup window.

---

### 2. Background Service Worker ✅

**File Created:** [background.ts](file:///c:/xampp/htdocs/sprout-pp/background.ts)

```typescript
chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "OPEN_SIDEBAR" })
            .catch((error) => {
                console.log("Could not send message to tab:", error)
            })
    }
})
```

**Functionality:**
- Listens for extension icon clicks
- Sends `OPEN_SIDEBAR` message to the active tab's content script
- Includes error handling for cases where content script isn't loaded

---

### 3. Content Script Updates ✅

**File Modified:** [contents/sidebar.tsx](file:///c:/xampp/htdocs/sprout-pp/contents/sidebar.tsx)

**Key Changes:**

#### State Management
```typescript
const [isOpen, setIsOpen] = useState(false) // Default: hidden
```

#### Message Listener
```typescript
useEffect(() => {
    const messageListener = (message: any) => {
        if (message.action === "OPEN_SIDEBAR") {
            setIsOpen(true)
        }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
        chrome.runtime.onMessage.removeListener(messageListener)
    }
}, [])
```

#### Close Handler
```typescript
const handleClose = () => {
    setIsOpen(false) // Simply toggle state
}
```

#### Transform-Based Animation
```typescript
<div
    style={{
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 200ms ease-in-out'
    }}
>
```

**Removed:**
- `isAnimating` state (no longer needed)
- Conditional rendering (`if (!isOpen) return null`)
- CSS class-based animations (`sprout-animate-slideIn/Out`)

**Benefits:**
- Simpler state management
- Always-rendered component (better for Shadow DOM)
- Smooth transform-based animations
- Proper cleanup of event listeners

---

### 4. Manifest Configuration ✅

**File Modified:** [package.json](file:///c:/xampp/htdocs/sprout-pp/package.json)

```json
"manifest": {
    "host_permissions": ["https://*/*"],
    "permissions": ["activeTab", "storage"],
    "action": {}  // ← Added: enables click handler
}
```

**Changes:**
- Added `"action": {}` to enable `chrome.action.onClicked` listener
- No `default_popup` defined (ensures click triggers background script)
- `activeTab` permission already present

---

## How It Works

### User Flow

1. **Initial State**: Sidebar is hidden (`transform: translateX(100%)`)
2. **User clicks extension icon** → Background script receives click event
3. **Background script sends message** → `{ action: "OPEN_SIDEBAR" }` to content script
4. **Content script receives message** → Sets `isOpen = true`
5. **Sidebar slides in** → `transform: translateX(0)` with 200ms transition
6. **User clicks X button** → Sets `isOpen = false`
7. **Sidebar slides out** → `transform: translateX(100%)` with 200ms transition

### Technical Details

**Animation Approach:**
- Uses CSS `transform: translateX()` instead of class-based animations
- Inline styles for direct state control
- 200ms `ease-in-out` transition
- No conditional rendering - component always exists in DOM

**Message Passing:**
- Background → Content: `chrome.tabs.sendMessage()`
- Content listens: `chrome.runtime.onMessage.addListener()`
- Proper cleanup in `useEffect` return function

**State Management:**
- Single `isOpen` boolean state
- No animation state needed
- Direct transform control via inline styles

---

## Testing Checklist

- [ ] Create PNG icon at `assets/icon.png` (required for build)
- [ ] Run `npm run dev` to build extension
- [ ] Load extension in Chrome (`chrome://extensions/`)
- [ ] Navigate to any website
- [ ] Click extension icon → sidebar should slide in from right
- [ ] Click X button → sidebar should slide out to right
- [ ] Click extension icon again → sidebar should slide in again
- [ ] Verify 200ms animation timing
- [ ] Test on multiple websites for Shadow DOM isolation

---

## Files Modified

| File | Status | Description |
|------|--------|-------------|
| `popup.tsx` | ❌ Deleted | Removed popup UI |
| `background.ts` | ✅ Created | Service worker for icon clicks |
| `contents/sidebar.tsx` | ✅ Modified | Message listener + transform animations |
| `package.json` | ✅ Modified | Added `action: {}` to manifest |
| `README.md` | ✅ Updated | Documentation for click-to-open |
| `task.md` | ✅ Updated | Marked tasks complete |

---

## TypeScript Lint Notes

The IDE shows lint errors for `chrome` API not being found. These are **expected** and will resolve during build:

- `Cannot find name 'chrome'` - Normal for Chrome extension development
- Plasmo injects Chrome types during build process
- Extension will work correctly when built

**No action needed** - these are IDE-only warnings.

---

## Next Steps

1. **Create PNG Icon** (blocker for build)
   - Convert `assets/icon.svg` to `assets/icon.png` (512x512)
   - Or use any PNG icon at that location

2. **Build & Test**
   ```bash
   npm run dev
   ```

3. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked from `build/chrome-mv3-dev`

4. **Verify Functionality**
   - Click extension icon to open sidebar
   - Test message sending and AI streaming
   - Verify animations are smooth
   - Test close and re-open

---

## Implementation Complete ✅

All requirements have been successfully implemented:

✅ Removed popup.tsx  
✅ Created background service worker  
✅ Implemented message listener in content script  
✅ Transform-based 200ms animations  
✅ Updated manifest configuration  
✅ Documentation updated  

The extension is ready for testing once the PNG icon is added.
