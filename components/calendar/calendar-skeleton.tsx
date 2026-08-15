import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<Skeleton className="mb-2 h-8 w-32" />
				<Skeleton className="h-4 w-48" />
			</div>

			<div className="border rounded-lg bg-background">
				<div className="flex min-h-[800px]">
					{/* Sidebar skeleton */}
					<div className="hidden xl:block w-80 flex-shrink-0 border-r">
						<div className="flex h-full flex-col">
							<div className="p-6 border-b">
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="p-4">
								<Skeleton className="h-64 w-full" />
							</div>
							<div className="border-t p-4">
								<div className="space-y-3">
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
								</div>
							</div>
						</div>
					</div>

					{/* Main content skeleton */}
					<div className="min-w-0 flex-1">
						<div className="flex items-center justify-between border-b p-6">
							<div className="flex items-center gap-3">
								<Skeleton className="size-9" />
								<Skeleton className="size-9" />
								<Skeleton className="h-9 w-16" />
								<Skeleton className="h-8 w-40" />
							</div>
							<Skeleton className="h-10 w-64" />
						</div>
						<div className="grid grid-cols-7 border-b">
							{Array.from({ length: 7 }).map((_, i) => (
								<div key={i} className="border-r p-4 last:border-r-0">
									<Skeleton className="mx-auto h-4 w-8" />
								</div>
							))}
						</div>
						<div className="grid grid-cols-7 flex-1">
							{Array.from({ length: 35 }).map((_, i) => (
								<div
									key={i}
									className="min-h-[120px] border-b border-r p-2 last:border-r-0"
								>
									<Skeleton className="mb-2 h-4 w-6" />
									<div className="space-y-1">
										<Skeleton className="h-5 w-full" />
										<Skeleton className="h-5 w-2/3" />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}