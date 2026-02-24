import type { PlasmoCSConfig, PlasmoGetShadowHostId, PlasmoGetStyle } from "plasmo"
import { useState, useEffect, useRef } from "react"
import { Sidebar } from "~components/Sidebar"

import styleText from "data-text:~styles/sidebar.css"
import iconBase64 from "data-base64:~assets/icon.png"

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

    useEffect(() => {
        if (isOpen) {
            document.body.style.marginRight = "384px" // w-96
            document.body.style.transition = "margin-right 0.3s ease-in-out"
        } else {
            document.body.style.marginRight = "0px"
        }

        return () => {
            document.body.style.marginRight = "0px"
        }
    }, [isOpen])

    const toggleSidebar = () => {
        setIsOpen(!isOpen)
    }

    const handleClose = () => {
        setIsOpen(false)
    }

    if (!chrome.runtime?.id) return null

    return (
        <div className="sprout-reset">
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={toggleSidebar}
                    className="sprout-fixed sprout-bottom-4 sprout-right-4 sprout-h-14 sprout-w-14 sprout-rounded-full sprout-bg-green-600 sprout-shadow-xl sprout-cursor-pointer sprout-z-[2147483646] sprout-flex sprout-items-center sprout-justify-center sprout-hover:sprout-scale-110 sprout-transition-transform sprout-duration-200 sprout-border-2 sprout-border-white"
                    aria-label="Open Sidebar"
                >
                    <img
                        src={iconBase64}
                        alt="Sprout Logo"
                        className="sprout-h-8 sprout-w-8 sprout-object-contain"
                        style={{ filter: "brightness(0) invert(1)" }}
                    />
                </button>
            )}

            {/* Sidebar Container */}
            <div
                className="sprout-fixed sprout-top-0 sprout-right-0 sprout-h-screen sprout-w-96 sprout-shadow-2xl sprout-z-[2147483647] sprout-bg-white sprout-border-l sprout-border-gray-200"
                style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 200ms ease-in-out'
                }}
            >
                <Sidebar onClose={handleClose} />
            </div>
        </div>
    )
}

export default SidebarContent

