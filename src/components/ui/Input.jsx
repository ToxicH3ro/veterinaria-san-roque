"use client";

export default function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  className = "",
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="font-semibold text-[#112250]"
        >
          {label}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="
          w-full
          border
          border-gray-300
          rounded-lg
          px-4
          py-3
          outline-none
          transition
          focus:ring-2
          focus:ring-[#8FBFE3]
          disabled:bg-gray-100
          disabled:cursor-not-allowed
        "
      />
    </div>
  );
}