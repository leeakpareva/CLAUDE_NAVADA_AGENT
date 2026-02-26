"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Brief } from "@/lib/types";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["all", "geopolitical", "cyber", "economic", "military"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  geopolitical: "bg-blue-600/20 text-blue-400 border-blue-500/30",
  cyber: "bg-purple-600/20 text-purple-400 border-purple-500/30",
  military: "bg-red-600/20 text-red-400 border-red-500/30",
  economic: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
  general: "bg-zinc-600/20 text-zinc-400 border-zinc-500/30",
};

function BriefSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

export default function BriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Brief["category"]>("general");
  const [source, setSource] = useState("");

  async function fetchBriefs() {
    try {
      const res = await fetch("/api/briefs");
      if (res.ok) {
        const data = await res.json();
        setBriefs(data);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBriefs();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, source }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setCategory("general");
        setSource("");
        setOpen(false);
        fetchBriefs();
      }
    } catch {
      // silent fail
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <main className="flex-1 overflow-auto pt-12">
        <div className="mx-auto max-w-5xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Intelligence Briefs</h1>
              <p className="text-sm text-muted-foreground">
                Curated analysis and situation reports
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4" />
                  New Brief
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Intelligence Brief</DialogTitle>
                  <DialogDescription>
                    Add a new brief to the intelligence database.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brief-title">Title</Label>
                    <Input
                      id="brief-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brief-content">Content</Label>
                    <Textarea
                      id="brief-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Analysis and findings..."
                      className="min-h-32"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={category}
                        onValueChange={(v) => setCategory(v as Brief["category"])}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="geopolitical">Geopolitical</SelectItem>
                          <SelectItem value="cyber">Cyber</SelectItem>
                          <SelectItem value="economic">Economic</SelectItem>
                          <SelectItem value="military">Military</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brief-source">Source</Label>
                      <Input
                        id="brief-source"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="e.g. OSINT Analyst"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Saving..." : "Create Brief"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              {CATEGORIES.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="capitalize">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map((cat) => (
              <TabsContent key={cat} value={cat}>
                {loading ? (
                  <div className="mt-4 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <BriefSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {briefs
                      .filter((b) => cat === "all" || b.category === cat)
                      .map((brief) => (
                        <Card key={brief.id}>
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-sm">
                                {brief.title}
                              </CardTitle>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] capitalize",
                                  CATEGORY_COLORS[brief.category]
                                )}
                              >
                                {brief.category}
                              </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-2">
                              <span>{brief.source}</span>
                              <span>·</span>
                              <span>
                                {formatDistanceToNow(
                                  new Date(brief.created_at),
                                  { addSuffix: true }
                                )}
                              </span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {brief.content}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    {briefs.filter(
                      (b) => cat === "all" || b.category === cat
                    ).length === 0 && (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        No briefs in this category
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
