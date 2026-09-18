import { useState } from "react";

import { resolveApiAssetUrl } from "../../../services/api.js";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function LawyerAvatar({
  lawyer,
  name,
  className = "h-16 w-16 rounded-2xl text-lg",
  imageClassName = "",
}) {
  const displayName = name || lawyer?.displayName || "Lawyer";
  const imageUrl = resolveApiAssetUrl(lawyer?.profileImageUrl);
  const [failedUrl, setFailedUrl] = useState("");
  const showImage = Boolean(imageUrl && failedUrl !== imageUrl);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-brand-yellow/25 bg-brand-yellow-soft font-extrabold text-brand-black ${className}`}
      aria-label={`${displayName} profile image`}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={`${displayName} profile`}
          className={`h-full w-full object-cover ${imageClassName}`}
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <span aria-hidden="true">{getInitials(displayName)}</span>
      )}
    </div>
  );
}
