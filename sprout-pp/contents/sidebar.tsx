import type { PlasmoCSConfig, PlasmoGetShadowHostId, PlasmoGetStyle } from "plasmo"
import { useState, useEffect, useRef } from "react"
import { Sidebar } from "~components/Sidebar"

import styleText from "data-text:~styles/sidebar.css"

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    all_frames: false
}

export const getShadowHostId: PlasmoGetShadowHostId = () => "extension-sidebar-root"

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

function SidebarContent() {
    const [isOpen, setIsOpen] = useState(false)
    const isMounted = useRef(false)

    useEffect(() => {
        isMounted.current = true

        const messageListener = (message: any, sender: any, sendResponse: any) => {
            // Check if extension context is still valid
            if (!chrome.runtime?.id) return

            if (message.action === "OPEN_SIDEBAR") {
                if (isMounted.current) {
                    setIsOpen(true)
                }
            }
        }

        chrome.runtime.onMessage.addListener(messageListener)

        return () => {
            isMounted.current = false
            chrome.runtime.onMessage.removeListener(messageListener)
        }
    }, [])

    const handleClose = () => {
        setIsOpen(false)
    }

    // Return null if context invalid to prevent ghost rendering
    if (!chrome.runtime?.id) return null

    return (
        <div
            className="sprout-fixed sprout-top-0 sprout-right-0 sprout-h-screen sprout-w-96 sprout-shadow-2xl sprout-z-[2147483647]"
            style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 200ms ease-in-out'
            }}
        >
            <Sidebar onClose={handleClose} />
        </div>
    )
}

export default SidebarContent
