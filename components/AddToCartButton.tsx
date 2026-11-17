"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export function AddToCartButton({
  id,
  disabled,
  label,
  addedLabel,
  outLabel,
  className = "btn-primary w-full",
}: {
  id: number;
  disabled: boolean;
  label: string;
  addedLabel: string;
  outLabel: string;
  className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={() => {
        add(id);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
    >
      {disabled ? outLabel : added ? addedLabel : label}
    </button>
  );
}
