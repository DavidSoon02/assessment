import { FormEvent, useState } from 'react';
import { normalizeDiscountCode } from '~/lib/money';

export type DiscountCodeFieldProps = {
  /** Applied (normalized) code, or null. */
  value: string | null;
  onChange: (code: string | null) => void;
  /** Locks the code once the order exists, so the preview can't drift. */
  disabled?: boolean;
};

export function DiscountCodeField({
  value,
  onChange,
  disabled,
}: DiscountCodeFieldProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Its own <form> (not nested in BuyerForm), so Enter applies the code
  // instead of submitting the purchase.
  const onApply = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;

    const code = normalizeDiscountCode(draft);

    if (!code) {
      setError('Este código no es válido');
      return;
    }

    setError(null);
    setDraft('');
    onChange(code);
  };

  if (value) {
    return (
      <div className="mt-4 flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
        <span>
          Código <strong>{value}</strong> aplicado
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className="text-green-800 underline disabled:opacity-40"
        >
          Quitar
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onApply} className="mt-4">
      <label htmlFor="discount-code" className="text-sm font-medium">
        Código de descuento
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="discount-code"
          type="text"
          autoComplete="off"
          value={draft}
          disabled={disabled}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'discount-code-error' : undefined}
          className="w-full min-w-0 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-accent aria-invalid:border-red-500"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          className="rounded-full border border-ink/15 px-4 text-sm font-medium disabled:opacity-40"
        >
          Aplicar
        </button>
      </div>
      {error && (
        <p id="discount-code-error" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
