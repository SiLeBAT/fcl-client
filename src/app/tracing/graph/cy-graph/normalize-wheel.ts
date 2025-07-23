// The following values were are emprical determined (win10, mac os 15.5)
// by minimal mouse scroll / touch scroll
const FIREFOX_ON_WIN_WHEEL_WDY_UNIT = 120;
const CHROME_ON_WIN_WHEEL_DY_UNIT = 100;

const FIREFOX_ON_MAC_TOUCH_WHEEL_DY_UNIT = 1;
const FIREFOX_ON_MAC_MOUSE_WHEEL_DY_UNIT = 16; // dependent app and context ??

const CHROME_OR_SAFARI_ON_MAC_TOUCH_WHEEL_DY_UNIT = 1;
const CHROME_OR_SAFARI_ON_MAC_MOUSE_WHEEL_DY_UNIT = 4;

// MAC reports a adaptive deltaY
// if user scroll speed goes up so does deltaY
const MAC_WHEEL_FACTOR = 1 / 10;

enum OSType {
    WIN = "win",
    MAC = "mac",
    OTHER = "other",
}

enum BrowserType {
    FIREFOX = "firefox",
    CHROMIUM = "chromium",
    SAFARI = "safari",
    OTHER = "other",
}

interface WheelEventWithWheelDeltaY extends WheelEvent {
    wheelDeltaY: number;
}

function hasWheelDeltaY(
    event: MouseEvent | WheelEventWithWheelDeltaY,
): event is WheelEventWithWheelDeltaY {
    return (event as WheelEventWithWheelDeltaY).wheelDeltaY !== undefined;
}

function getOSType(): OSType {
    if (navigator.userAgent.indexOf("Win") !== -1) {
        return OSType.WIN;
    }
    if (navigator.userAgent.indexOf("Mac") !== -1) {
        return OSType.MAC;
    }
    return OSType.OTHER;
}

function getBrowserType(): BrowserType {
    if (navigator.userAgent.indexOf("Firefox/") !== -1) {
        return BrowserType.FIREFOX;
    }
    if (navigator.userAgent.indexOf("Chrome/") !== -1) {
        return BrowserType.CHROMIUM;
    }
    if (navigator.userAgent.indexOf("Safari/") !== -1) {
        return BrowserType.SAFARI;
    }
    return BrowserType.OTHER;
}

/**
 *  function returns a normalized deltaY for the wheel event
 *  that convert the event deltaY in a mulitple of the minimal wheel event
 *  representing a minimal wheel event
 *
 */
export function getNormalizedWheelDY(event: WheelEvent): number {
    const osType = getOSType();
    const browserType = getBrowserType();

    if (osType === OSType.WIN) {
        if (browserType === BrowserType.FIREFOX && hasWheelDeltaY(event)) {
            return -event.wheelDeltaY / FIREFOX_ON_WIN_WHEEL_WDY_UNIT; // wheelDeltaY has opposite sign of deltaY
        }
        if (
            event.deltaMode === event.DOM_DELTA_PIXEL &&
            browserType === BrowserType.CHROMIUM
        ) {
            return event.deltaY / CHROME_ON_WIN_WHEEL_DY_UNIT;
        }
    } else if (osType === OSType.MAC) {
        if (browserType === BrowserType.FIREFOX) {
            if (event.deltaX !== 0) {
                // touch event
                return (
                    (event.deltaY / FIREFOX_ON_MAC_TOUCH_WHEEL_DY_UNIT) *
                    MAC_WHEEL_FACTOR
                );
            } else {
                return (
                    (event.deltaY / FIREFOX_ON_MAC_MOUSE_WHEEL_DY_UNIT) *
                    MAC_WHEEL_FACTOR
                );
            }
        }
        if (
            browserType === BrowserType.CHROMIUM ||
            browserType === BrowserType.SAFARI
        ) {
            if (!Number.isInteger(event.deltaY)) {
                // mouse wheel deltaY is assumed to be fractional
                return (
                    (event.deltaY /
                        CHROME_OR_SAFARI_ON_MAC_MOUSE_WHEEL_DY_UNIT) *
                    MAC_WHEEL_FACTOR
                );
            } else {
                return (
                    (event.deltaY /
                        CHROME_OR_SAFARI_ON_MAC_TOUCH_WHEEL_DY_UNIT) *
                    MAC_WHEEL_FACTOR
                );
            }
        }
    }

    // the reported unit per mouse wheel tick or touch move is unknown
    // so we apply a fixed value
    return Math.sign(event.deltaY) * 2;
}
