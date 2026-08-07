<div className="flex flex-1 flex-col">
	<div className="@container/main flex flex-1 flex-col gap-2">
		<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
			<div className="px-4 lg:px-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
					<p className="text-muted-foreground">
						Manage your schedule and events
					</p>
				</div>
			</div>
			<div className="px-4 lg:px-6">
				<div className="border rounded-lg bg-background relative">
					<div className="flex min-h-[800px]">
						<div className="hidden xl:block w-80 flex-shrink-0 border-r">
							<div className="flex flex-col h-full bg-background rounded-lg h-full">
								<div className="p-6 border-b">
									<button
										data-slot="button"
										className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[&gt;svg]:px-3 w-full cursor-pointer"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											className="lucide lucide-plus w-4 h-4 mr-2"
											aria-hidden="true"
										>
											<path d="M5 12h14"></path>
											<path d="M12 5v14"></path>
										</svg>
										Add New Event
									</button>
								</div>
								<div className="flex justify-center">
									<div
										data-slot="calendar"
										className="rdp-root bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&amp;]:bg-transparent [[data-slot=popover-content]_&amp;]:bg-transparent rtl:**:[.rdp-button\_next&gt;svg]:rotate-180 rtl:**:[.rdp-button\_previous&gt;svg]:rotate-180 w-full [&amp;_[role=gridcell]_button]:cursor-pointer [&amp;_button]:cursor-pointer"
										data-mode="single"
									>
										<div className="flex gap-4 flex-col md:flex-row relative rdp-months">
											<nav
												className="flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between rdp-nav"
												aria-label="Navigation bar"
											>
												<button
													type="button"
													className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 has-[&gt;svg]:px-3 size-(--cell-size) aria-disabled:opacity-50 p-0 select-none rdp-button_previous"
													aria-label="Go to the Previous Month"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="24"
														height="24"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
														stroke-linejoin="round"
														className="lucide lucide-chevron-left size-4 rdp-chevron"
														aria-hidden="true"
													>
														<path d="m15 18-6-6 6-6"></path>
													</svg>
												</button>
												<button
													type="button"
													className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 has-[&gt;svg]:px-3 size-(--cell-size) aria-disabled:opacity-50 p-0 select-none rdp-button_next"
													aria-label="Go to the Next Month"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="24"
														height="24"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
														stroke-linejoin="round"
														className="lucide lucide-chevron-right size-4 rdp-chevron"
														aria-hidden="true"
													>
														<path d="m9 18 6-6-6-6"></path>
													</svg>
												</button>
											</nav>
											<div className="flex flex-col w-full gap-4 rdp-month">
												<div className="flex items-center justify-center h-(--cell-size) w-full px-(--cell-size) rdp-month_caption">
													<span
														className="select-none font-medium text-sm rdp-caption_label"
														role="status"
														aria-live="polite"
													>
														August 2026
													</span>
												</div>
												<table
													role="grid"
													aria-multiselectable="false"
													aria-label="August 2026"
													className="rdp-month_grid"
												>
													<thead aria-hidden="true">
														<tr className="flex rdp-weekdays">
															<th
																aria-label="Sunday"
																className="text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none rdp-weekday"
																scope="col"
															>
																Su
															</th>
															<th
																aria-label="Monday"
																className="text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none rdp-weekday"
																scope="col"
															>
																Mo
															</th>
															<th
																aria-label="Tuesday"
																className="text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none rdp-weekday"
																scope="col"
															>
																Tu
															</th>
															<th
																aria-label="Wednesday"
																className="text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none rdp-weekday"
																scope="col"
															>
																We
															</th>
															<th
																aria-label="Thursday"
																className="text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none rdp-weekday"
																scope="col"
															>
																Th
															</th>
															<th
																aria-label="Friday"
																className="text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none rdp-weekday"
																scope="col"
															>
																Fr
															</th>
															<th
																aria-label="Saturday"
																className="text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none rdp-weekday"
																scope="col"
															>
																Sa
															</th>
														</tr>
													</thead>
													<tbody className="rdp-weeks">
														<tr className="flex w-full mt-2 rdp-week">
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day text-muted-foreground aria-selected:text-muted-foreground rdp-outside"
																role="gridcell"
																data-day="2026-07-26"
																data-month="2026-07"
																data-outside="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="7/26/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Sunday, July 26th, 2026"
																>
																	26
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day text-muted-foreground aria-selected:text-muted-foreground rdp-outside"
																role="gridcell"
																data-day="2026-07-27"
																data-month="2026-07"
																data-outside="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="7/27/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Monday, July 27th, 2026"
																>
																	27
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day text-muted-foreground aria-selected:text-muted-foreground rdp-outside"
																role="gridcell"
																data-day="2026-07-28"
																data-month="2026-07"
																data-outside="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="7/28/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Tuesday, July 28th, 2026"
																>
																	28
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day text-muted-foreground aria-selected:text-muted-foreground rdp-outside"
																role="gridcell"
																data-day="2026-07-29"
																data-month="2026-07"
																data-outside="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="7/29/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Wednesday, July 29th, 2026"
																>
																	29
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day text-muted-foreground aria-selected:text-muted-foreground rdp-outside"
																role="gridcell"
																data-day="2026-07-30"
																data-month="2026-07"
																data-outside="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="7/30/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Thursday, July 30th, 2026"
																>
																	30
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day text-muted-foreground aria-selected:text-muted-foreground rdp-outside"
																role="gridcell"
																data-day="2026-07-31"
																data-month="2026-07"
																data-outside="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="7/31/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Friday, July 31st, 2026"
																>
																	31
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-01"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/1/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Saturday, August 1st, 2026"
																>
																	1
																</button>
															</td>
														</tr>
														<tr className="flex w-full mt-2 rdp-week">
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-02"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/2/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Sunday, August 2nd, 2026"
																>
																	2
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-03"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/3/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Monday, August 3rd, 2026"
																>
																	3
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day rdp-selected"
																role="gridcell"
																aria-selected="true"
																data-day="2026-08-04"
																data-selected="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/4/2026"
																	data-selected-single="true"
																	type="button"
																	tabindex="0"
																	aria-label="Tuesday, August 4th, 2026, selected"
																>
																	4
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-05"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/5/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Wednesday, August 5th, 2026"
																>
																	5
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-06"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/6/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Thursday, August 6th, 2026"
																>
																	6
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none rdp-today"
																role="gridcell"
																data-day="2026-08-07"
																data-today="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/7/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Today, Friday, August 7th, 2026"
																>
																	7
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-08"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/8/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Saturday, August 8th, 2026"
																>
																	8
																</button>
															</td>
														</tr>
														<tr className="flex w-full mt-2 rdp-week">
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-09"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/9/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Sunday, August 9th, 2026"
																>
																	9
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-10"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/10/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Monday, August 10th, 2026"
																>
																	10
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day relative after:absolute after:bottom-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full"
																role="gridcell"
																data-day="2026-08-11"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/11/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Tuesday, August 11th, 2026"
																>
																	11
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-12"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/12/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Wednesday, August 12th, 2026"
																>
																	12
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-13"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/13/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Thursday, August 13th, 2026"
																>
																	13
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-14"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/14/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Friday, August 14th, 2026"
																>
																	14
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day relative after:absolute after:bottom-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full"
																role="gridcell"
																data-day="2026-08-15"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/15/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Saturday, August 15th, 2026"
																>
																	15
																</button>
															</td>
														</tr>
														<tr className="flex w-full mt-2 rdp-week">
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-16"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/16/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Sunday, August 16th, 2026"
																>
																	16
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-17"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/17/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Monday, August 17th, 2026"
																>
																	17
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day relative after:absolute after:bottom-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full"
																role="gridcell"
																data-day="2026-08-18"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/18/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Tuesday, August 18th, 2026"
																>
																	18
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-19"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/19/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Wednesday, August 19th, 2026"
																>
																	19
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day relative after:absolute after:bottom-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full"
																role="gridcell"
																data-day="2026-08-20"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/20/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Thursday, August 20th, 2026"
																>
																	20
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-21"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/21/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Friday, August 21st, 2026"
																>
																	21
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day relative after:absolute after:bottom-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full"
																role="gridcell"
																data-day="2026-08-22"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/22/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Saturday, August 22nd, 2026"
																>
																	22
																</button>
															</td>
														</tr>
														<tr className="flex w-full mt-2 rdp-week">
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-23"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/23/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Sunday, August 23rd, 2026"
																>
																	23
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-24"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/24/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Monday, August 24th, 2026"
																>
																	24
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day relative after:absolute after:bottom-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full"
																role="gridcell"
																data-day="2026-08-25"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/25/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Tuesday, August 25th, 2026"
																>
																	25
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-26"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/26/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Wednesday, August 26th, 2026"
																>
																	26
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day relative after:absolute after:bottom-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full"
																role="gridcell"
																data-day="2026-08-27"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/27/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Thursday, August 27th, 2026"
																>
																	27
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-28"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/28/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Friday, August 28th, 2026"
																>
																	28
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-29"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/29/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Saturday, August 29th, 2026"
																>
																	29
																</button>
															</td>
														</tr>
														<tr className="flex w-full mt-2 rdp-week">
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-30"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/30/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Sunday, August 30th, 2026"
																>
																	30
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day"
																role="gridcell"
																data-day="2026-08-31"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="8/31/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Monday, August 31st, 2026"
																>
																	31
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day text-muted-foreground aria-selected:text-muted-foreground rdp-outside"
																role="gridcell"
																data-day="2026-09-01"
																data-month="2026-09"
																data-outside="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="9/1/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Tuesday, September 1st, 2026"
																>
																	1
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day text-muted-foreground aria-selected:text-muted-foreground rdp-outside"
																role="gridcell"
																data-day="2026-09-02"
																data-month="2026-09"
																data-outside="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="9/2/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Wednesday, September 2nd, 2026"
																>
																	2
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day text-muted-foreground aria-selected:text-muted-foreground rdp-outside"
																role="gridcell"
																data-day="2026-09-03"
																data-month="2026-09"
																data-outside="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="9/3/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Thursday, September 3rd, 2026"
																>
																	3
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day text-muted-foreground aria-selected:text-muted-foreground rdp-outside"
																role="gridcell"
																data-day="2026-09-04"
																data-month="2026-09"
																data-outside="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="9/4/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Friday, September 4th, 2026"
																>
																	4
																</button>
															</td>
															<td
																className="relative w-full h-full p-0 text-center [&amp;:first-child[data-selected=true]_button]:rounded-l-md [&amp;:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none rdp-day text-muted-foreground aria-selected:text-muted-foreground rdp-outside"
																role="gridcell"
																data-day="2026-09-05"
																data-month="2026-09"
																data-outside="true"
															>
																<button
																	data-slot="button"
																	className="items-center justify-center whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&amp;&gt;span]:text-xs [&amp;&gt;span]:opacity-70 rdp-day rdp-day_button"
																	data-day="9/5/2026"
																	type="button"
																	tabindex="-1"
																	aria-label="Saturday, September 5th, 2026"
																>
																	5
																</button>
															</td>
														</tr>
													</tbody>
												</table>
											</div>
										</div>
									</div>
								</div>
								<div
									data-orientation="horizontal"
									role="none"
									data-slot="separator"
									className="bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px"
								></div>
								<div className="flex-1 p-4">
									<div className="space-y-4">
										<div>
											<div
												data-state="open"
												data-slot="collapsible"
												className="group/collapsible"
											>
												<button
													type="button"
													aria-controls="radix-_r_v_"
													aria-expanded="true"
													data-state="open"
													data-slot="collapsible-trigger"
													className="flex items-center justify-between w-full p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
												>
													<span className="text-sm font-medium">
														My Calendars
													</span>
													<div className="flex items-center gap-1">
														<div className="h-5 w-5 flex items-center justify-center opacity-0 group-hover/collapsible:opacity-100 cursor-pointer hover:bg-accent rounded-sm">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="24"
																height="24"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
																className="lucide lucide-plus h-3 w-3"
																aria-hidden="true"
															>
																<path d="M5 12h14"></path>
																<path d="M12 5v14"></path>
															</svg>
														</div>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="24"
															height="24"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
															className="lucide lucide-chevron-right h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90"
															aria-hidden="true"
														>
															<path d="m9 18 6-6-6-6"></path>
														</svg>
													</div>
												</button>
												<div
													data-state="open"
													id="radix-_r_v_"
													data-slot="collapsible-content"
													style={{
														transitionDuration: "0s",
														animationName: "none",
														"-RadixCollapsibleContentHeight": "116px",
														"-RadixCollapsibleContentWidth":
															"287.20001220703125px",
													}}
												>
													<div className="mt-2 space-y-1">
														<div className="group/calendar-item">
															<div className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md">
																<div className="flex items-center gap-3 flex-1">
																	<button className="flex aspect-square size-4 shrink-0 items-center justify-center rounded-sm border transition-all cursor-pointer border-transparent text-white bg-blue-500">
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			width="24"
																			height="24"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			stroke-width="2"
																			stroke-linecap="round"
																			stroke-linejoin="round"
																			className="lucide lucide-check size-3"
																			aria-hidden="true"
																		>
																			<path d="M20 6 9 17l-5-5"></path>
																		</svg>
																	</button>
																	<span className="flex-1 truncate text-sm cursor-pointer">
																		Personal
																	</span>
																	<div className="opacity-0 group-hover/calendar-item:opacity-100">
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			width="24"
																			height="24"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			stroke-width="2"
																			stroke-linecap="round"
																			stroke-linejoin="round"
																			className="lucide lucide-eye h-3 w-3 text-muted-foreground"
																			aria-hidden="true"
																		>
																			<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
																			<circle cx="12" cy="12" r="3"></circle>
																		</svg>
																	</div>
																	<div
																		className="h-5 w-5 flex items-center justify-center p-0 opacity-0 group-hover/calendar-item:opacity-100 cursor-pointer hover:bg-accent rounded-sm"
																		type="button"
																		id="radix-_r_10_"
																		aria-haspopup="menu"
																		aria-expanded="false"
																		data-state="closed"
																		data-slot="dropdown-menu-trigger"
																	>
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			width="24"
																			height="24"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			stroke-width="2"
																			stroke-linecap="round"
																			stroke-linejoin="round"
																			className="lucide lucide-ellipsis h-3 w-3"
																			aria-hidden="true"
																		>
																			<circle cx="12" cy="12" r="1"></circle>
																			<circle cx="19" cy="12" r="1"></circle>
																			<circle cx="5" cy="12" r="1"></circle>
																		</svg>
																	</div>
																</div>
															</div>
														</div>
														<div className="group/calendar-item">
															<div className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md">
																<div className="flex items-center gap-3 flex-1">
																	<button className="flex aspect-square size-4 shrink-0 items-center justify-center rounded-sm border transition-all cursor-pointer border-transparent text-white bg-green-500">
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			width="24"
																			height="24"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			stroke-width="2"
																			stroke-linecap="round"
																			stroke-linejoin="round"
																			className="lucide lucide-check size-3"
																			aria-hidden="true"
																		>
																			<path d="M20 6 9 17l-5-5"></path>
																		</svg>
																	</button>
																	<span className="flex-1 truncate text-sm cursor-pointer">
																		Work
																	</span>
																	<div className="opacity-0 group-hover/calendar-item:opacity-100">
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			width="24"
																			height="24"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			stroke-width="2"
																			stroke-linecap="round"
																			stroke-linejoin="round"
																			className="lucide lucide-eye h-3 w-3 text-muted-foreground"
																			aria-hidden="true"
																		>
																			<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
																			<circle cx="12" cy="12" r="3"></circle>
																		</svg>
																	</div>
																	<div
																		className="h-5 w-5 flex items-center justify-center p-0 opacity-0 group-hover/calendar-item:opacity-100 cursor-pointer hover:bg-accent rounded-sm"
																		type="button"
																		id="radix-_r_12_"
																		aria-haspopup="menu"
																		aria-expanded="false"
																		data-state="closed"
																		data-slot="dropdown-menu-trigger"
																	>
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			width="24"
																			height="24"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			stroke-width="2"
																			stroke-linecap="round"
																			stroke-linejoin="round"
																			className="lucide lucide-ellipsis h-3 w-3"
																			aria-hidden="true"
																		>
																			<circle cx="12" cy="12" r="1"></circle>
																			<circle cx="19" cy="12" r="1"></circle>
																			<circle cx="5" cy="12" r="1"></circle>
																		</svg>
																	</div>
																</div>
															</div>
														</div>
														<div className="group/calendar-item">
															<div className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-md">
																<div className="flex items-center gap-3 flex-1">
																	<button className="flex aspect-square size-4 shrink-0 items-center justify-center rounded-sm border transition-all cursor-pointer border-transparent text-white bg-pink-500">
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			width="24"
																			height="24"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			stroke-width="2"
																			stroke-linecap="round"
																			stroke-linejoin="round"
																			className="lucide lucide-check size-3"
																			aria-hidden="true"
																		>
																			<path d="M20 6 9 17l-5-5"></path>
																		</svg>
																	</button>
																	<span className="flex-1 truncate text-sm cursor-pointer">
																		Family
																	</span>
																	<div className="opacity-0 group-hover/calendar-item:opacity-100">
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			width="24"
																			height="24"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			stroke-width="2"
																			stroke-linecap="round"
																			stroke-linejoin="round"
																			className="lucide lucide-eye h-3 w-3 text-muted-foreground"
																			aria-hidden="true"
																		>
																			<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
																			<circle cx="12" cy="12" r="3"></circle>
																		</svg>
																	</div>
																	<div
																		className="h-5 w-5 flex items-center justify-center p-0 opacity-0 group-hover/calendar-item:opacity-100 cursor-pointer hover:bg-accent rounded-sm"
																		type="button"
																		id="radix-_r_14_"
																		aria-haspopup="menu"
																		aria-expanded="false"
																		data-state="closed"
																		data-slot="dropdown-menu-trigger"
																	>
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			width="24"
																			height="24"
																			viewBox="0 0 24 24"
																			fill="none"
																			stroke="currentColor"
																			stroke-width="2"
																			stroke-linecap="round"
																			stroke-linejoin="round"
																			className="lucide lucide-ellipsis h-3 w-3"
																			aria-hidden="true"
																		>
																			<circle cx="12" cy="12" r="1"></circle>
																			<circle cx="19" cy="12" r="1"></circle>
																			<circle cx="5" cy="12" r="1"></circle>
																		</svg>
																	</div>
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div>
											<div
												data-state="closed"
												data-slot="collapsible"
												className="group/collapsible"
											>
												<button
													type="button"
													aria-controls="radix-_r_16_"
													aria-expanded="false"
													data-state="closed"
													data-slot="collapsible-trigger"
													className="flex items-center justify-between w-full p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
												>
													<span className="text-sm font-medium">Favorites</span>
													<div className="flex items-center gap-1">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="24"
															height="24"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
															className="lucide lucide-chevron-right h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90"
															aria-hidden="true"
														>
															<path d="m9 18 6-6-6-6"></path>
														</svg>
													</div>
												</button>
												<div
													data-state="closed"
													id="radix-_r_16_"
													hidden=""
													data-slot="collapsible-content"
													style=""
												></div>
											</div>
										</div>
										<div>
											<div
												data-state="closed"
												data-slot="collapsible"
												className="group/collapsible"
											>
												<button
													type="button"
													aria-controls="radix-_r_17_"
													aria-expanded="false"
													data-state="closed"
													data-slot="collapsible-trigger"
													className="flex items-center justify-between w-full p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
												>
													<span className="text-sm font-medium">Other</span>
													<div className="flex items-center gap-1">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="24"
															height="24"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
															className="lucide lucide-chevron-right h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90"
															aria-hidden="true"
														>
															<path d="m9 18 6-6-6-6"></path>
														</svg>
													</div>
												</button>
												<div
													data-state="closed"
													id="radix-_r_17_"
													hidden=""
													data-slot="collapsible-content"
													style=""
												></div>
											</div>
										</div>
									</div>
								</div>
								<div className="p-4 border-t">
									<button
										data-slot="button"
										className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[&gt;svg]:px-3 w-full justify-start cursor-pointer"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											className="lucide lucide-plus w-4 h-4 mr-2"
											aria-hidden="true"
										>
											<path d="M5 12h14"></path>
											<path d="M12 5v14"></path>
										</svg>
										New Calendar
									</button>
								</div>
							</div>
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex flex-col h-full">
								<div className="flex flex-col flex-wrap gap-4 p-6 border-b md:flex-row md:items-center md:justify-between">
									<div className="flex items-center gap-4 flex-wrap">
										<button
											data-slot="button"
											className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[&gt;svg]:px-2.5 xl:hidden cursor-pointer"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												className="lucide lucide-menu w-4 h-4"
												aria-hidden="true"
											>
												<path d="M4 5h16"></path>
												<path d="M4 12h16"></path>
												<path d="M4 19h16"></path>
											</svg>
										</button>
										<div className="flex items-center gap-2">
											<button
												data-slot="button"
												className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[&gt;svg]:px-2.5 cursor-pointer"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="24"
													height="24"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													className="lucide lucide-chevron-left w-4 h-4"
													aria-hidden="true"
												>
													<path d="m15 18-6-6 6-6"></path>
												</svg>
											</button>
											<button
												data-slot="button"
												className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[&gt;svg]:px-2.5 cursor-pointer"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="24"
													height="24"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													className="lucide lucide-chevron-right w-4 h-4"
													aria-hidden="true"
												>
													<path d="m9 18 6-6-6-6"></path>
												</svg>
											</button>
											<button
												data-slot="button"
												className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[&gt;svg]:px-2.5 cursor-pointer"
											>
												Today
											</button>
										</div>
										<h1 className="text-2xl font-semibold">August 2026</h1>
									</div>
									<div className="flex flex-col gap-3 md:flex-row md:items-center">
										<div className="relative">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												className="lucide lucide-search w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
												aria-hidden="true"
											>
												<path d="m21 21-4.34-4.34"></path>
												<circle cx="11" cy="11" r="8"></circle>
											</svg>
											<input
												data-slot="input"
												className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive pl-10 w-64"
												placeholder="Search events..."
											/>
										</div>
										<button
											data-slot="dropdown-menu-trigger"
											className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[&gt;svg]:px-3 cursor-pointer"
											type="button"
											id="radix-_r_18_"
											aria-haspopup="menu"
											aria-expanded="false"
											data-state="closed"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												className="lucide lucide-grid3x3 lucide-grid-3x3 w-4 h-4 mr-2"
												aria-hidden="true"
											>
												<rect width="18" height="18" x="3" y="3" rx="2"></rect>
												<path d="M3 9h18"></path>
												<path d="M3 15h18"></path>
												<path d="M9 3v18"></path>
												<path d="M15 3v18"></path>
											</svg>
											Month
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												className="lucide lucide-chevron-down w-4 h-4 ml-2"
												aria-hidden="true"
											>
												<path d="m6 9 6 6 6-6"></path>
											</svg>
										</button>
									</div>
								</div>
								<div className="flex-1 bg-background">
									<div className="grid grid-cols-7 border-b">
										<div className="p-4 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
											Sun
										</div>
										<div className="p-4 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
											Mon
										</div>
										<div className="p-4 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
											Tue
										</div>
										<div className="p-4 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
											Wed
										</div>
										<div className="p-4 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
											Thu
										</div>
										<div className="p-4 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
											Fri
										</div>
										<div className="p-4 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
											Sat
										</div>
									</div>
									<div className="grid grid-cols-7 flex-1">
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-muted/30 text-muted-foreground">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">26</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-muted/30 text-muted-foreground">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">27</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-muted/30 text-muted-foreground">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">28</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-muted/30 text-muted-foreground">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">29</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-muted/30 text-muted-foreground">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">30</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-muted/30 text-muted-foreground">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">31</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">1</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">2</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">3</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50 ring-2 ring-primary ring-inset">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">4</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">5</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">6</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors hover:bg-accent/50 bg-accent/20">
											<div className="flex items-center justify-between mb-1">
												<span className="font-medium bg-primary text-primary-foreground rounded-md w-6 h-6 flex items-center justify-center text-xs">
													7
												</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">8</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">9</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">10</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">11</span>
											</div>
											<div className="space-y-1">
												<div className="text-xs p-1 rounded-sm text-white cursor-pointer truncate bg-blue-500">
													<div className="flex items-center gap-1">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="24"
															height="24"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
															className="lucide lucide-clock w-3 h-3"
															aria-hidden="true"
														>
															<path d="M12 6v6l4 2"></path>
															<circle cx="12" cy="12" r="10"></circle>
														</svg>
														<span className="truncate">Team Standup</span>
													</div>
												</div>
												<div className="text-xs p-1 rounded-sm text-white cursor-pointer truncate bg-purple-500">
													<div className="flex items-center gap-1">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="24"
															height="24"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
															className="lucide lucide-clock w-3 h-3"
															aria-hidden="true"
														>
															<path d="M12 6v6l4 2"></path>
															<circle cx="12" cy="12" r="10"></circle>
														</svg>
														<span className="truncate">Design Review</span>
													</div>
												</div>
											</div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">12</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">13</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">14</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">15</span>
											</div>
											<div className="space-y-1">
												<div className="text-xs p-1 rounded-sm text-white cursor-pointer truncate bg-green-500">
													<div className="flex items-center gap-1">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="24"
															height="24"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
															className="lucide lucide-clock w-3 h-3"
															aria-hidden="true"
														>
															<path d="M12 6v6l4 2"></path>
															<circle cx="12" cy="12" r="10"></circle>
														</svg>
														<span className="truncate">Product Launch</span>
													</div>
												</div>
											</div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">16</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">17</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">18</span>
											</div>
											<div className="space-y-1">
												<div className="text-xs p-1 rounded-sm text-white cursor-pointer truncate bg-orange-500">
													<div className="flex items-center gap-1">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="24"
															height="24"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
															className="lucide lucide-clock w-3 h-3"
															aria-hidden="true"
														>
															<path d="M12 6v6l4 2"></path>
															<circle cx="12" cy="12" r="10"></circle>
														</svg>
														<span className="truncate">
															Client Presentation
														</span>
													</div>
												</div>
											</div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">19</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">20</span>
											</div>
											<div className="space-y-1">
												<div className="text-xs p-1 rounded-sm text-white cursor-pointer truncate bg-pink-500">
													<div className="flex items-center gap-1">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="24"
															height="24"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
															className="lucide lucide-clock w-3 h-3"
															aria-hidden="true"
														>
															<path d="M12 6v6l4 2"></path>
															<circle cx="12" cy="12" r="10"></circle>
														</svg>
														<span className="truncate">Birthday Party 🎉</span>
													</div>
												</div>
											</div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">21</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">22</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">23</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">24</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">25</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">26</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">27</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">28</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">29</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">30</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-background hover:bg-accent/50">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">31</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-muted/30 text-muted-foreground">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">1</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-muted/30 text-muted-foreground">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">2</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-muted/30 text-muted-foreground">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">3</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-muted/30 text-muted-foreground">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">4</span>
											</div>
											<div className="space-y-1"></div>
										</div>
										<div className="min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors bg-muted/30 text-muted-foreground">
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">5</span>
											</div>
											<div className="space-y-1"></div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>;
