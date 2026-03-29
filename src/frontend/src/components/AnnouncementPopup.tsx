import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, X } from "lucide-react";
import { useEffect, useState } from "react";

type AnnouncementCategory =
  | { LatestProduct: null }
  | { UpcomingProduct: null }
  | { LatestScheme: null }
  | { NewGiftArticle: null };

interface AdminAnnouncement {
  id: bigint;
  title: string;
  body: string;
  category: AnnouncementCategory;
  createdAt: bigint;
  isActive: boolean;
  imageUrl: [] | [string];
}

function getCategoryLabel(cat: AnnouncementCategory): string {
  if ("LatestProduct" in cat) return "Latest Product";
  if ("UpcomingProduct" in cat) return "Upcoming Products";
  if ("LatestScheme" in cat) return "Latest Scheme";
  if ("NewGiftArticle" in cat) return "New Gift Article";
  return "Announcement";
}

function getCategoryColor(cat: AnnouncementCategory): string {
  if ("LatestProduct" in cat)
    return "bg-blue-100 text-blue-800 border-blue-200";
  if ("UpcomingProduct" in cat)
    return "bg-green-100 text-green-800 border-green-200";
  if ("LatestScheme" in cat)
    return "bg-orange-100 text-orange-800 border-orange-200";
  if ("NewGiftArticle" in cat)
    return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function getCategoryIcon(cat: AnnouncementCategory): string {
  if ("LatestProduct" in cat) return "📦";
  if ("UpcomingProduct" in cat) return "🚀";
  if ("LatestScheme" in cat) return "🎯";
  if ("NewGiftArticle" in cat) return "🎁";
  return "📢";
}

function AnnouncementImage({ src }: { src: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <img
      src={src}
      alt=""
      className="w-full rounded-lg border mt-3 object-contain"
      style={{ maxHeight: 200 }}
      onError={() => setHidden(true)}
    />
  );
}

interface AnnouncementPopupProps {
  actor: any;
}

export default function AnnouncementPopup({ actor }: AnnouncementPopupProps) {
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [dateKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (!actor) return;
    let cancelled = false;
    async function check() {
      try {
        const seen = await (actor as any).hasUserSeenAnnouncementsToday(
          dateKey,
        );
        if (seen || cancelled) return;
        const active = (await (
          actor as any
        ).getActiveAnnouncements()) as AdminAnnouncement[];
        if (cancelled) return;
        await (actor as any).recordUserAnnouncementView(dateKey);
        if (active.length > 0) {
          setAnnouncements(active);
          setOpen(true);
        }
      } catch {
        // silently ignore
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [actor, dateKey]);

  if (!open) return null;

  const grouped: Record<string, AdminAnnouncement[]> = {};
  for (const ann of announcements) {
    const label = getCategoryLabel(ann.category);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(ann);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-lg w-full p-0 overflow-hidden"
        data-ocid="announcement.dialog"
      >
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Admin Message
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Updates from your company
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-4 space-y-4">
            {Object.entries(grouped).map(([label, items]) => (
              <div key={label}>
                {items.map((ann) => (
                  <div
                    key={ann.id.toString()}
                    className="rounded-xl border bg-card p-4 shadow-sm mb-3 last:mb-0"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl leading-none mt-0.5">
                        {getCategoryIcon(ann.category)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getCategoryColor(
                              ann.category,
                            )}`}
                          >
                            {getCategoryLabel(ann.category)}
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-foreground leading-snug">
                          {ann.title}
                        </p>
                        {ann.body && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">
                            {ann.body}
                          </p>
                        )}
                        {ann.imageUrl[0] && (
                          <AnnouncementImage src={ann.imageUrl[0]} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-muted/30 flex justify-end">
          <Button
            onClick={() => setOpen(false)}
            data-ocid="announcement.close_button"
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
