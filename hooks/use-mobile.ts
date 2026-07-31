import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
	const mqlRef = React.useRef<MediaQueryList | null>(null);
	const [isMobile, setIsMobile] = React.useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		return window.innerWidth < MOBILE_BREAKPOINT;
	});

	React.useEffect(() => {
		mqlRef.current = window.matchMedia(
			`(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
		);
		const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mqlRef.current.addEventListener("change", onChange);
		return () => mqlRef.current?.removeEventListener("change", onChange);
	}, []);

	return isMobile;
}
