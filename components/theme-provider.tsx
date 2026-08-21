"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
	undefined,
);

function resolveTheme(t: Theme): "light" | "dark" {
	if (t === "system") {
		return typeof window !== "undefined" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	}
	return t;
}

function applyTheme(t: Theme): "light" | "dark" {
	const resolved = resolveTheme(t);
	const root = document.documentElement;
	root.classList.remove("light", "dark");
	root.classList.add(resolved);
	root.style.colorScheme = resolved;
	return resolved;
}

function getInitialTheme(): Theme {
	if (typeof window === "undefined") return "system";
	const stored = localStorage.getItem("theme") as Theme | null;
	return stored ?? "system";
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = React.useState<Theme>(getInitialTheme);
	const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(
		() => resolveTheme(getInitialTheme()),
	);
	const mounted = React.useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);

	React.useEffect(() => {
		const stored = localStorage.getItem("theme") as Theme | null;
		const initial = stored ?? "system";
		applyTheme(initial);
	}, []);

	React.useEffect(() => {
		if (!mounted) return;
		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			const res = applyTheme(theme);
			setResolvedTheme(res);
		};
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, [theme, mounted]);

	React.useEffect(() => {
		if (!mounted) return;
		function isTypingTarget(target: EventTarget | null) {
			if (!(target instanceof HTMLElement)) return false;
			return (
				target.isContentEditable ||
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.tagName === "SELECT"
			);
		}
		function onKeyDown(e: KeyboardEvent) {
			if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey)
				return;
			if (e.key?.toLowerCase() !== "d") return;
			if (isTypingTarget(e.target)) return;
			const next = resolvedTheme === "dark" ? "light" : "dark";
			localStorage.setItem("theme", next);
			applyTheme(next);
			setThemeState(next);
			setResolvedTheme(next);
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [mounted, resolvedTheme]);

	function setTheme(t: Theme) {
		setThemeState(t);
		localStorage.setItem("theme", t);
		const res = applyTheme(t);
		setResolvedTheme(res);
	}

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

function useTheme() {
	const ctx = React.useContext(ThemeContext);
	if (!ctx) {
		return {
			theme: "system" as Theme,
			resolvedTheme: "light" as const,
			setTheme: () => {},
		};
	}
	return ctx;
}

export { ThemeProvider, useTheme };
