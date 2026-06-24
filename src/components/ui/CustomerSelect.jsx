import { useState, useRef, useEffect } from "react";

export default function CustomerSelect({
  customers = [],
  value,
  onChange,
  required,
  placeholder = "Search customer...",
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = customers.find((c) => String(c.id) === String(value));

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = (c) =>
    c.customer_id ? `[${c.customer_id}] ${c.name}` : c.name;

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.customer_id && c.customer_id.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  });

  const handleSelect = (c) => {
    onChange(String(c.id));
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setOpen(false);
  };

  const displayValue = open ? query : (selected ? label(selected) : query);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input type="hidden" value={value ?? ""} required={required} readOnly />
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
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
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400">No customers found</li>
          ) : (
            filtered.map((c) => (
              <li
                key={c.id}
                onMouseDown={() => handleSelect(c)}
                className={`px-3 py-2.5 cursor-pointer hover:bg-blue-50 ${
                  String(c.id) === String(value)
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700"
                }`}
              >
                <p className="text-sm font-medium leading-tight">
                  {c.customer_id && (
                    <span className="text-blue-500 mr-1 font-mono text-xs">[{c.customer_id}]</span>
                  )}
                  {c.name}
                </p>
                {(c.city || c.specialization) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[c.specialization, c.city].filter(Boolean).join(" · ")}
                  </p>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
