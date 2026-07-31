/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import { Heart, MessageCircle, PenSquare, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const postTypes = [
	{ value: "TEXT", label: "Text" },
	{ value: "BIBLE_VERSE", label: "Bible Verse" },
	{ value: "PRAYER_REQUEST", label: "Prayer Request" },
	{ value: "TESTIMONIAL", label: "Testimonial" },
	{ value: "PRAISE_REPORT", label: "Praise Report" },
	{ value: "PRAYER_ANSWER", label: "Prayer Answer" },
	{ value: "QUOTE", label: "Quote" },
	{ value: "LINK", label: "Link" },
];

interface Post {
	id: string;
	type: string;
	body?: string;
	versePassage?: string;
	linkUrl?: string;
	createdAt: string;
	authorId: string;
	_count: { comments: number; likes: number };
}

export default function FeedPage() {
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(false);
	const [newPost, setNewPost] = useState({
		type: "TEXT",
		body: "",
		versePassage: "",
		linkUrl: "",
	});

	async function fetchPosts() {
		try {
			const res = await fetch("/api/v1/posts?limit=20");
			const data = await res.json();
			if (data.success) setPosts(data.data);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchPosts();
	}, [fetchPosts]);

	async function createPost() {
		const body: Record<string, unknown> = {
			type: newPost.type,
			body: newPost.body,
		};
		if (newPost.versePassage) body.versePassage = newPost.versePassage;
		if (newPost.linkUrl) body.linkUrl = newPost.linkUrl;

		const res = await fetch("/api/v1/posts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		const data = await res.json();
		if (data.success) {
			setPosts([data.data, ...posts]);
			setOpen(false);
			setNewPost({ type: "TEXT", body: "", versePassage: "", linkUrl: "" });
		}
	}

	async function toggleLike(postId: string) {
		await fetch(`/api/v1/posts/${postId}/likes`, { method: "POST" });
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Community Feed</h2>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger render={<Button className="cursor-pointer" />}>
						<PenSquare className="mr-2 size-4" />
						New Post
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create a Post</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<Label>Post Type</Label>
								<Select
									value={newPost.type}
									onValueChange={(v) => {
										if (v) setNewPost({ ...newPost, type: v });
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{postTypes.map((t) => (
											<SelectItem key={t.value} value={t.value}>
												{t.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<Label>Content</Label>
								<Textarea
									value={newPost.body}
									onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
										setNewPost({ ...newPost, body: e.target.value })
									}
									placeholder="Share your thoughts..."
								/>
							</div>
							{newPost.type === "BIBLE_VERSE" && (
								<div className="flex flex-col gap-2">
									<Label>Bible Passage</Label>
									<Input
										value={newPost.versePassage}
										onChange={(e) =>
											setNewPost({ ...newPost, versePassage: e.target.value })
										}
										placeholder="e.g. John 3:16"
									/>
								</div>
							)}
							{newPost.type === "LINK" && (
								<div className="flex flex-col gap-2">
									<Label>Link URL</Label>
									<Input
										value={newPost.linkUrl}
										onChange={(e) =>
											setNewPost({ ...newPost, linkUrl: e.target.value })
										}
										placeholder="https://..."
									/>
								</div>
							)}
							<Button onClick={createPost} className="cursor-pointer">
								Post
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{loading ? (
				<div className="flex justify-center py-12">
					<p className="text-muted-foreground">Loading feed...</p>
				</div>
			) : posts.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-4 py-12">
						<PenSquare className="size-10 text-muted-foreground" />
						<p className="text-muted-foreground">
							No posts yet. Be the first to share!
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="flex flex-col gap-4">
					{posts.map((post) => (
						<Card key={post.id}>
							<CardContent className="flex flex-col gap-3 pt-6">
								<div className="flex items-center gap-2">
									<Badge variant="secondary">
										{post.type.replace("_", " ")}
									</Badge>
									<span className="text-xs text-muted-foreground">
										{new Date(post.createdAt).toLocaleDateString()}
									</span>
								</div>
								{post.body && <p className="text-sm">{post.body}</p>}
								{post.versePassage && (
									<p className="text-sm text-muted-foreground italic">
										{post.versePassage}
									</p>
								)}
								{post.linkUrl && (
									<a
										href={post.linkUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-primary hover:underline"
									>
										{post.linkUrl}
									</a>
								)}
								<div className="flex items-center gap-4 pt-2">
									<Button
										variant="ghost"
										size="sm"
										className="cursor-pointer"
										onClick={() => toggleLike(post.id)}
									>
										<Heart className="mr-1 size-4" />
										{post._count.likes}
									</Button>
									<Button variant="ghost" size="sm" className="cursor-pointer">
										<MessageCircle className="mr-1 size-4" />
										{post._count.comments}
									</Button>
									<Button variant="ghost" size="sm" className="cursor-pointer">
										<Share2 className="mr-1 size-4" />
										Share
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
