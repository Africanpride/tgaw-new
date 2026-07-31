import type React from "react";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div>
			{children}
			<div className="text-xs">
				(Press <kbd>d</kbd> to toggle dark mode)
			</div>
		</div>
	);
}
