export default function Card({
  children,
  className = "",
  title,
  description,
}) {
  return (
    <section
      className={`
        bg-white
        rounded-xl
        shadow-md
        p-6
        ${className}
      `}
    >
      {(title || description) && (
        <div className="mb-5">
          {title && (
            <h2 className="text-xl font-bold text-[#112250]">
              {title}
            </h2>
          )}

          {description && (
            <p className="text-gray-500 mt-1">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}