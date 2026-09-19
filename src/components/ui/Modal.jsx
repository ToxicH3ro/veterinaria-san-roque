"use client";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) {
  if (!isOpen) {
    return null;
  }

  const tamaños = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`
          w-full
          ${tamaños[size] || tamaños.md}
          max-h-[90vh]
          overflow-y-auto
          bg-white
          rounded-xl
          shadow-2xl
        `}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-[#112250]">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="
              text-gray-500
              hover:text-gray-800
              text-2xl
              font-bold
              transition
            "
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}