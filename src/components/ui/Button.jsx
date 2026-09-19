"use client";

export default function Button({
  children,
  type = "button",
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
}) {
  const variantes = {
    primary:
      "bg-[#E57A3A] hover:bg-[#d96d2f] text-white",

    secondary:
      "bg-[#112250] hover:bg-[#0d1a3d] text-white",

    outline:
      "border border-[#112250] text-[#112250] hover:bg-[#112250] hover:text-white",

    light:
      "bg-[#8FBFE3] hover:bg-[#72add8] text-[#112250]",

    danger:
      "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantes[variant] || variantes.primary}
        font-semibold
        px-5
        py-3
        rounded-lg
        shadow-md
        transition
        duration-200
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
}