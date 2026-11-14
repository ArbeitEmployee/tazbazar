import React, { useMemo, useState } from "react";
import { FaChevronDown, FaShareAlt, FaStar, FaQuoteLeft, FaCheckCircle } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { toast } from "react-hot-toast";
import SearchableSelect from "../../components/SearchableSelect";

const reviewFieldClassName =
  "w-full rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-xs px-4 py-2.5 text-sm text-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.05)]";

const renderStars = (rating = 0, className = "h-3.5 w-3.5") =>
  Array.from({ length: 5 }).map((_, index) => (
    <FaStar
      key={`review-star-${index}`}
      className={`${className} drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-transform duration-200 ${
        index < Math.round(Number(rating || 0))
          ? "fill-amber-400 text-amber-400"
          : "text-slate-200"
      }`}
    />
  ));

const getReviewerDisplayName = (review = {}) =>
  String(review?.user?.name || review?.reviewerName || "Customer").trim() ||
  "Customer";

const getReviewerInitials = (review = {}) => {
  const displayName = getReviewerDisplayName(review);
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (!parts.length) return "CU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

const ProductReviewsPanel = ({
  isLoggedIn = false,
  myReview = null,
  productTitle = "",
  reviewSummary = {},
  reviews = [],
  reviewsLoading = false,
  reviewForm = {},
  hoverRating = null,
  reviewSubmitting = false,
  reviewDeleting = false,
  user = null,
  onLoginNavigate,
  onFieldChange,
  onHoverRatingChange,
  onRatingChange,
  onSubmitReview,
  onDeleteReview,
  onEditReview,
}) => {
  const [reviewSortOrder, setReviewSortOrder] = useState("recent");

  const sortedReviews = useMemo(() => {
    const nextReviews = [...(Array.isArray(reviews) ? reviews : [])];

    if (reviewSortOrder === "highest") {
      return nextReviews.sort((a, b) => {
        const ratingDiff = Number(b?.rating || 0) - Number(a?.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime()
        );
      });
    }

    if (reviewSortOrder === "lengthy") {
      return nextReviews.sort((a, b) => {
        const lengthDiff =
          String(b?.comment || "").length - String(a?.comment || "").length;
        if (lengthDiff !== 0) return lengthDiff;
        return (
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime()
        );
      });
    }

    return nextReviews.sort(
      (a, b) =>
        new Date(b?.createdAt || 0).getTime() -
        new Date(a?.createdAt || 0).getTime(),
    );
  }, [reviewSortOrder, reviews]);

  const normalizedReviewSummary = useMemo(() => {
    const reviewList = Array.isArray(reviews) ? reviews : [];
    const explicitAverage = Number(reviewSummary?.ratingAverage);
    const explicitCount = Number(reviewSummary?.ratingCount);
    const fallbackCount = reviewList.length;
    const fallbackAverage =
      fallbackCount > 0
        ? reviewList.reduce(
            (sum, review) => sum + Number(review?.rating || 0),
            0,
          ) / fallbackCount
        : 0;

    return {
      ratingAverage:
        Number.isFinite(explicitAverage) && explicitAverage >= 0
          ? explicitAverage
          : fallbackAverage,
      ratingCount:
        Number.isFinite(explicitCount) && explicitCount >= 0
          ? explicitCount
          : fallbackCount,
    };
  }, [reviewSummary, reviews]);

  const handleShareReview = async (review = {}) => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}#reviews`
        : "";
    const shareTitle = String(
      review?.title || productTitle || "Product review",
    ).trim();

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: String(review?.comment || "")
            .trim()
            .slice(0, 180),
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Review link copied");
      }
    } catch {
      // ignore dismissed share events
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-6 pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Customer Voice Header & Community Feedback List */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          {/* 3D Glassmorphic Header */}
          <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 sm:p-6 text-white shadow-[0_20px_40px_-15px_rgba(15,23,42,0.35)] border border-white/10">
            {/* Background Ambient Glows */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-blue-200 mb-2 shadow-inner">
                  <HiSparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Customer Voice</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
                  Product Reviews & Ratings
                </h2>
                <p className="mt-1 text-xs text-slate-300">
                  Honest feedback and impressions from verified buyers.
                </p>
              </div>

              {/* 3D Floating Score Badge */}
              <div className="flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 px-5 py-3 shadow-[0_10px_25px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.25)] self-start sm:self-auto transform hover:scale-105 transition-transform duration-300">
                <div className="text-center">
                  <span className="block text-3xl font-black tracking-tight text-white drop-shadow-md">
                    {Number(normalizedReviewSummary.ratingAverage || 0).toFixed(1)}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 justify-center">
                    {renderStars(normalizedReviewSummary.ratingAverage || 0, "h-3.5 w-3.5")}
                  </div>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-left">
                  <span className="block text-sm font-bold text-white">
                    {normalizedReviewSummary.ratingCount || 0}
                  </span>
                  <span className="text-[11px] font-medium text-slate-300 whitespace-nowrap">
                    {normalizedReviewSummary.ratingCount === 1 ? "Total Review" : "Total Reviews"}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Community Feedback & Reviews List */}
          <div>
            {/* Review Feed Bar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Community Feedback
                </h3>
                <p className="text-xs text-slate-500">
                  {reviewsLoading
                    ? "Loading reviews..."
                    : `Showing ${sortedReviews.length} approved review${sortedReviews.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="w-full sm:w-auto">
                <SearchableSelect
                  value={reviewSortOrder}
                  onChange={setReviewSortOrder}
                  options={[
                    { value: "recent", label: "Most Recent" },
                    { value: "highest", label: "Highest Rated" },
                    { value: "lengthy", label: "Detailed Reviews" },
                  ]}
                  placeholder="Sort by"
                  searchable={false}
                  className="w-full sm:w-44"
                  buttonClassName="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-300 transition"
                  menuClassName="rounded-xl"
                />
              </div>
            </div>

            {/* 3D Review Cards List */}
            <div className="space-y-4">
              {reviewsLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 shadow-xs">
                  Loading reviews...
                </div>
              ) : sortedReviews.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-8 text-center text-xs text-slate-500">
                  No reviews yet. Be the first to share your experience!
                </div>
              ) : (
                sortedReviews.map((review) => {
                  const belongsToCurrentUser =
                    user &&
                    String(review.user?._id || review.user || review.userId || "") ===
                      String(user._id || user.id || "");

                  return (
                    <article
                      key={review._id}
                      className="group relative rounded-2xl bg-gradient-to-b from-white via-white to-slate-50/50 p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* 3D Avatar with Gradient Rim */}
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-900 text-white font-extrabold text-xs shadow-md border-2 border-white">
                            {getReviewerInitials(review)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-extrabold text-slate-900">
                                {review.title || "Product Review"}
                              </h4>
                              {review.verifiedPurchase && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 shadow-2xs">
                                  <FaCheckCircle className="h-2.5 w-2.5" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              <span className="font-semibold text-slate-700">{getReviewerDisplayName(review)}</span>
                              <span className="mx-1.5 text-slate-300">&middot;</span>
                              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>

                        {/* Stars Pill */}
                        <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 px-2.5 py-1 border border-slate-200/60 shadow-inner shrink-0">
                          {renderStars(review.rating || 0, "h-3 w-3")}
                        </div>
                      </div>

                      <div className="mt-3 relative pl-3 border-l-2 border-indigo-200/80">
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                          {review.comment}
                        </p>
                      </div>

                      {/* Footer Controls */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-3">
                          {belongsToCurrentUser && (
                            <>
                              <button
                                type="button"
                                onClick={() => onEditReview?.(review)}
                                className="text-xs font-bold text-slate-600 hover:text-black transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={onDeleteReview}
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleShareReview(review)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
                        >
                          <FaShareAlt className="h-2.5 w-2.5 text-slate-400" />
                          <span>Share</span>
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Review Form (Write / Edit Review) */}
        <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-24">
          <section
            id="review-form"
            className="relative rounded-3xl bg-gradient-to-b from-white to-slate-50/70 p-5 sm:p-6 border border-slate-200/90 shadow-[0_12px_32px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.02)] transition-all"
          >
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {myReview ? "Edit Your Perspective" : "Write a Review"}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Feedback
              </span>
            </div>

            <form onSubmit={onSubmitReview} className="space-y-4">
              {/* Star Rating Selection Bar */}
              <div className="flex flex-col gap-2 p-3 sm:p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Overall Quality Score:
                  </label>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-xs font-extrabold text-slate-800 shadow-2xs border border-slate-200">
                    {hoverRating || reviewForm.rating ? `${hoverRating || reviewForm.rating} / 5` : "Tap a star"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const currentRating = Number(
                      hoverRating ?? reviewForm.rating ?? 0,
                    );
                    const active = currentRating >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => onHoverRatingChange?.(star)}
                        onMouseLeave={() => onHoverRatingChange?.(null)}
                        onClick={() => onRatingChange?.(star)}
                        className="p-1 rounded-xl hover:bg-white hover:shadow-xs transition-all duration-200 cursor-pointer transform hover:scale-115"
                        aria-label={`Rate ${star} star`}
                      >
                        <FaStar
                          className={`h-6 w-6 drop-shadow-xs transition-colors ${
                            active
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300 hover:text-amber-200"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Guest User Inputs */}
              {!isLoggedIn ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={reviewForm.reviewerName || ""}
                      onChange={(event) =>
                        onFieldChange?.("reviewerName", event.target.value)
                      }
                      className={reviewFieldClassName}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={reviewForm.reviewerEmail || ""}
                      onChange={(event) =>
                        onFieldChange?.("reviewerEmail", event.target.value)
                      }
                      className={reviewFieldClassName}
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
              ) : null}

              {/* Title */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Headline
                </label>
                <input
                  type="text"
                  value={reviewForm.title || ""}
                  onChange={(event) =>
                    onFieldChange?.("title", event.target.value)
                  }
                  className={reviewFieldClassName}
                  placeholder="e.g. Absolutely loved the finish and quality!"
                />
              </div>

              {/* Detailed comment */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Detailed Experience
                </label>
                <textarea
                  rows={4}
                  value={reviewForm.comment || ""}
                  onChange={(event) =>
                    onFieldChange?.("comment", event.target.value)
                  }
                  className={`${reviewFieldClassName} resize-none`}
                  placeholder="Tell others what you liked, sizing, feel or durability..."
                />
              </div>

              {/* Action Buttons with 3D Depth */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {myReview ? (
                  <button
                    type="button"
                    onClick={onDeleteReview}
                    disabled={reviewDeleting}
                    className="rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-xs font-bold text-rose-600 shadow-2xs hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer transform active:scale-95 disabled:opacity-50"
                  >
                    {reviewDeleting ? "Deleting..." : "Delete Review"}
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 px-7 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_6px_20px_rgba(15,23,42,0.3)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.4)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:translate-y-0 disabled:opacity-50"
                >
                  {reviewSubmitting
                    ? myReview
                      ? "Updating..."
                      : "Submitting..."
                    : myReview
                      ? "Update Review"
                      : "Submit Review"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProductReviewsPanel;
