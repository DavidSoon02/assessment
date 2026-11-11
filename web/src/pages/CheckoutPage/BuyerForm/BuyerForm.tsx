import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

const buyerSchema = yup.object({
  name: yup.string().trim().required('Ingresa tu nombre'),
  email: yup
    .string()
    .trim()
    .required('Ingresa tu correo')
    .email('Ingresa un correo válido'),
});

export type BuyerFormValues = yup.InferType<typeof buyerSchema>;

export type BuyerFormProps = {
  onSubmit: (values: BuyerFormValues) => void | Promise<void>;
  /** Work the parent is still doing after onSubmit resolves (e.g. confirm). */
  submitting?: boolean;
  /** Error from the API (sold out, validation…), shown above the button. */
  error?: string | null;
};

const inputClass =
  'mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 outline-none focus:border-accent aria-invalid:border-red-500';

export function BuyerForm({ onSubmit, submitting, error }: BuyerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isHandlingSubmit },
  } = useForm<BuyerFormValues>({
    resolver: yupResolver(buyerSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '' },
  });

  const isSubmitting = isHandlingSubmit || Boolean(submitting);

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 space-y-4"
    >
      <div>
        <label htmlFor="buyer-name" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="buyer-name"
          type="text"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'buyer-name-error' : undefined}
          className={inputClass}
          {...register('name')}
        />
        {errors.name && (
          <p id="buyer-name-error" className="mt-1 text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="buyer-email" className="text-sm font-medium">
          Correo
        </label>
        <input
          id="buyer-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'buyer-email-error' : undefined}
          className={inputClass}
          {...register('email')}
        />
        {errors.email && (
          <p id="buyer-email-error" className="mt-1 text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        {isSubmitting ? 'Procesando…' : 'Pagar'}
      </button>
    </form>
  );
}
