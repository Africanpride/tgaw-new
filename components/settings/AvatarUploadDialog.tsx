"use client";

import { Camera, Loader2, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	removeProfileImage,
	updateProfileImage,
} from "@/lib/actions/settingsActions";

const MAX_AVATAR_BYTES = 1 * 1024 * 1024; // 1MB

interface AvatarUploadDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentImage?: string | null;
	userName?: string;
	initials?: string;
	onAvatarUpdated?: (newUrl: string | null) => void;
}

export function AvatarUploadDialog({
	open,
	onOpenChange,
	currentImage,
	userName = "User",
	initials = "U",
	onAvatarUpdated,
}: AvatarUploadDialogProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const activeDisplayUrl = previewUrl || currentImage || null;

	const handleFileSelect = (file: File) => {
		if (!file.type.startsWith("image/")) {
			toast.error("Please select a valid image file (PNG, JPG, WEBP).");
			return;
		}

		// 1MB limit
		if (file.size > MAX_AVATAR_BYTES) {
			toast.error("Image file size must be less than 1MB.");
			return;
		}

		setSelectedFile(file);
		const objectUrl = URL.createObjectURL(file);
		setPreviewUrl(objectUrl);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleClearSelection = () => {
		if (previewUrl && previewUrl.startsWith("blob:")) {
			URL.revokeObjectURL(previewUrl);
		}
		setSelectedFile(null);
		setPreviewUrl(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleRemovePhoto = async () => {
		setIsUploading(true);
		try {
			const res = await removeProfileImage();

			if (!res.success) {
				throw new Error(res.error || "Failed to remove photo");
			}

			handleClearSelection();
			onAvatarUpdated?.(null);
			toast.success("Profile photo removed.");
			onOpenChange(false);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to remove photo";
			toast.error(msg);
		} finally {
			setIsUploading(false);
		}
	};

	const handleUploadAndSave = async () => {
		if (!selectedFile) {
			toast.error("Please choose a photo to upload.");
			return;
		}

		setIsUploading(true);
		const toastId = toast.loading("Uploading your photo...");

		try {
			// 1. Get signed upload signature from backend
			const signRes = await fetch("/api/v1/uploads/sign", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ folder: "tgaw/avatars" }),
			});

			const signData = await signRes.json();
			if (!signRes.ok || !signData.success || !signData.data) {
				throw new Error(
					signData.error || "Failed to generate upload signature",
				);
			}

			const { timestamp, signature, folder, upload_preset, apiKey, cloudName } =
				signData.data;

			if (!cloudName || !apiKey) {
				throw new Error(
					"Photo upload is temporarily unavailable. Please try again.",
				);
			}

			// 2. Direct upload to Cloudinary API
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("api_key", apiKey);
			formData.append("timestamp", timestamp.toString());
			formData.append("signature", signature);
			formData.append("folder", folder);
			if (upload_preset) formData.append("upload_preset", upload_preset);

			const uploadRes = await fetch(
				`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
				{
					method: "POST",
					body: formData,
				},
			);

			const uploadResult = await uploadRes.json();
			if (!uploadRes.ok || !uploadResult.secure_url) {
				const raw = uploadResult.error?.message || "";
				const message = raw.includes("Invalid Signature")
					? "Upload failed — please refresh the page and try again."
					: raw || "Failed to upload your photo.";
				throw new Error(message);
			}

			const secureUrl: string = uploadResult.secure_url;

			// 3. Update Better Auth user profile image
			const updateRes = await updateProfileImage({ imageUrl: secureUrl });

			if (!updateRes.success) {
				throw new Error(updateRes.error || "Failed to update profile photo");
			}

			toast.success("Profile photo updated successfully!", { id: toastId });
			onAvatarUpdated?.(secureUrl);
			handleClearSelection();
			onOpenChange(false);
		} catch (err) {
			const msg =
				err instanceof Error ? err.message : "Failed to upload profile photo";
			toast.error(msg, { id: toastId });
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!isUploading) {
					if (!next) handleClearSelection();
					onOpenChange(next);
				}
			}}
		>
			<DialogContent className="gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-md">
				<DialogHeader className="border-b px-6 py-4">
					<DialogTitle className="text-lg font-semibold text-foreground">
						Update Profile Photo
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground">
						Upload a clear photo to help community members recognize you.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center gap-6 px-6 py-6">
					{/* Avatar display & Dropzone */}
					<div
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={`relative flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-colors ${
							isDragging
								? "border-primary bg-primary/5"
								: "border-muted-foreground/25 bg-muted/20 hover:bg-muted/40"
						}`}
					>
						<div className="relative mb-3">
							<Avatar className="size-24 border-2 border-border shadow-sm">
								<AvatarImage
									src={activeDisplayUrl ?? undefined}
									alt={userName}
									className="object-cover"
								/>
								<AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
									{initials}
								</AvatarFallback>
							</Avatar>

							{/* Top right quick-clear button if previewing a new file */}
							{previewUrl && (
								<Button
									type="button"
									size="icon-xs"
									variant="destructive"
									className="-top-1 -right-1 absolute size-6 rounded-full p-0 shadow"
									onClick={handleClearSelection}
									disabled={isUploading}
								>
									<X className="size-3" />
									<span className="sr-only">Clear selection</span>
								</Button>
							)}
						</div>

						<p className="text-center font-medium text-foreground text-sm">
							{selectedFile ? selectedFile.name : "Drag & drop an image here"}
						</p>
						<p className="mt-0.5 text-center text-muted-foreground text-xs">
							Supports PNG, JPG, or WEBP (Max 1MB)
						</p>

						<input
							ref={fileInputRef}
							type="file"
							accept="image/png,image/jpeg,image/jpg,image/webp"
							className="hidden"
							onChange={handleFileChange}
							disabled={isUploading}
						/>

						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3 cursor-pointer gap-1.5"
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading}
						>
							<Camera className="size-3.5" />
							{selectedFile ? "Choose different file" : "Browse computer"}
						</Button>
					</div>
				</div>

				<DialogFooter className="flex flex-col-reverse gap-3 border-t bg-muted/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
					<div>
						{currentImage && !previewUrl && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
								onClick={handleRemovePhoto}
								disabled={isUploading}
							>
								{isUploading ? (
									<Loader2 className="mr-1.5 size-3.5 animate-spin" />
								) : (
									<Trash2 className="mr-1.5 size-3.5" />
								)}
								Remove photo
							</Button>
						)}
					</div>

					<div className="flex w-full items-center justify-end gap-3 sm:w-auto">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								handleClearSelection();
								onOpenChange(false);
							}}
							disabled={isUploading}
						>
							Cancel
						</Button>

						<Button
							type="button"
							size="sm"
							className="gap-1.5"
							onClick={handleUploadAndSave}
							disabled={!selectedFile || isUploading}
						>
							{isUploading ? (
								<>
									<Loader2 className="size-3.5 animate-spin" />
									Uploading...
								</>
							) : (
								<>
									<Upload className="size-3.5" />
									Save Photo
								</>
							)}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
