import React from "react";

/**
 * Round user avatar circle. Renders an <img> when the user has an avatarUrl,
 * otherwise shows initials on a role-coloured gradient disk.
 *
 * Roles map to a colour family so the whole workbench stays visually consistent.
 */
const ROLE_GRADIENTS = {
  "control-room": "from-blue-600 to-slate-800",
  "safety-officer": "from-red-500 to-rose-800",
  "field-technician": "from-amber-500 to-orange-700",
  "plant-admin": "from-emerald-500 to-teal-700",
};

function getInitials(fullName, username) {
  const source = (fullName || username || "?").trim();
  const parts = source.split(/\s+/);
  const first = parts[0] ? parts[0][0] : "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

export default function Avatar({ user, size = 36, className = "", onClick }) {
  const gradient = ROLE_GRADIENTS[user?.role] || ROLE_GRADIENTS["plant-admin"];
  const initials = getInitials(user?.fullName, user?.username);

  const inner = user?.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user?.fullName || user?.username || "User"}
      style={{ width: size, height: size }}
      className={`rounded-full object-cover shrink-0 ${className}`}
    />
  ) : (
    <div
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.34)) }}
      className={`rounded-full bg-gradient-to-br ${gradient} text-white font-bold flex items-center justify-center shadow-md shrink-0 select-none ${className}`}
    >
      {initials}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Open profile"
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-transform hover:scale-105"
      >
        {inner}
      </button>
    );
  }
  return inner;
}