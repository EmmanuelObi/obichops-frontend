"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import type { StaffOrderHistoryReview } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { premium } from "@/lib/premium-styles";
import { cn } from "@/lib/utils";

interface VendorReviewFormProps {
  menuWeekId: string;
  vendorName: string;
  review: StaffOrderHistoryReview | null;
  onSaved: () => Promise<void>;
}

function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn(
            "rounded p-0.5 transition-colors",
            readOnly ? "cursor-default" : "hover:text-gold",
            star <= value ? "text-gold" : "text-muted-foreground/40",
          )}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
        >
          <Star
            className="size-5"
            fill={star <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

export function VendorReviewForm({
  menuWeekId,
  vendorName,
  review,
  onSaved,
}: VendorReviewFormProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [editing, setEditing] = useState(!review);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!token) return;
    if (rating < 1) {
      toast.error("Select a star rating");
      return;
    }

    setSaving(true);
    try {
      await apiClient(token).put(
        `/orders/me/history/${menuWeekId}/review`,
        {
          rating,
          ...(comment.trim() ? { comment: comment.trim() } : {}),
        },
      );
      toast.success("Review saved");
      setEditing(false);
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit() {
    setRating(review?.rating ?? 0);
    setComment(review?.comment ?? "");
    setEditing(true);
  }

  if (!editing && review) {
    return (
      <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Your review of {vendorName}</p>
            <p className="text-xs text-muted-foreground">
              Only admins can see this feedback.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleEdit}>
            Edit
          </Button>
        </div>
        <StarRating value={review.rating} readOnly />
        {review.comment ? (
          <p className="text-sm text-muted-foreground">{review.comment}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium">Rate {vendorName}</p>
        <p className="text-xs text-muted-foreground">
          How was the food this week? Only admins will see your review.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Rating</Label>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`review-comment-${menuWeekId}`}>
          Comment <span className="text-muted-foreground">(optional)</span>
        </Label>
        <textarea
          id={`review-comment-${menuWeekId}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="What stood out about the meals?"
          className={cn(premium.input, "min-h-20 resize-y")}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="premium"
          size="sm"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : review ? "Update review" : "Save review"}
        </Button>
        {review ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={() => {
              setRating(review.rating);
              setComment(review.comment ?? "");
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
