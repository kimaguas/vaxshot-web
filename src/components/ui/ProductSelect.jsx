import { useState, useRef, useEffect } from "react";

export default function ProductSelect({
  products = [],
  value,
  onChange,
  required,
  placeholder = "Search product...",
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedProduct = products.find((p) => String(p.id) === String(value));

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = products.filter((p) =>
    p.brand_name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (product) => {
    onChange(String(product.id));
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setOpen(false);
  };

  const displayValue = open ? query : (selectedProduct?.brand_name ?? query);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input type="hidden" value={value ?? ""} required={required} readOnly />
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-7 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 leading-none"
          >
            ×
          </button>
        ) : (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
            ▾
          </span>
        )}
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">No products found</li>
          ) : (
            filtered.map((p) => (
              <li
                key={p.id}
                onMouseDown={() => handleSelect(p)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${
                  String(p.id) === String(value)
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-gray-700"
                }`}
              >
                {p.brand_name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
