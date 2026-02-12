// ============================================================
// NumaLex — LoginForm (Client Component)
//
// Deux onglets :
//   Tab "email"  → email + password → signInWithEmail
//   Tab "phone"  → numéro Niger → OTP → verifyPhoneOtp
//
// Gère trois états :
//   1. Saisie initiale (email ou téléphone)
//   2. Vérification OTP (téléphone uniquement)
//   3. Succès → redirection
// ============================================================

'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import {
  signInWithEmail,
  signInWithPhone,
  verifyPhoneOtp,
  type AuthActionResult,
} from '@/lib/actions/auth';

// ---- Types locaux ----

type AuthMode = 'email' | 'phone';
type PhoneStep = 'input' | 'verify';

interface FieldError {
  field: string;
  message: string;
}

// ============================================================
// Composant principal
// ============================================================

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── État global ──
  const [mode, setMode] = useState<AuthMode>('email');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input');
  const [phoneNumber, setPhoneNumber] = useState('');

  // ── Feedback ──
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Timer anti-spam pour le renvoi OTP (60s) ──
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Démarre le compte à rebours de 60 secondes */
  function startCooldown() {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const busy = isPending;

  // ── Reset quand on change d'onglet ──
  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setPhoneStep('input');
    setResendCooldown(0);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setError(null);
    setFieldErrors([]);
    setSuccessMessage(null);
  }

  // ── Handler générique pour les résultats d'action ──
  function handleResult(result: AuthActionResult, onSuccess: () => void) {
    if (result.success) {
      setError(null);
      setFieldErrors([]);
      setSuccessMessage(result.message);
      onSuccess();
    } else {
      setSuccessMessage(null);
      setError(result.error);
      if (result.fieldErrors) {
        const errs: FieldError[] = [];
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          messages.forEach((msg) => errs.push({ field, message: msg }));
        });
        setFieldErrors(errs);
      } else {
        setFieldErrors([]);
      }
    }
  }

  // ============================================================
  // Handlers de soumission
  // ============================================================

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    setError(null);
    startTransition(async () => {
      const result = await signInWithEmail({ email, password });
      handleResult(result, () => {
        setTimeout(() => router.push('/dashboard'), 400);
      });
    });
  }

  function handlePhoneSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const phone = form.get('phone') as string;

    setError(null);
    setPhoneNumber(phone.replace(/[\s\-().]/g, ''));

    startTransition(async () => {
      const result = await signInWithPhone({ phone });
      handleResult(result, () => {
        setPhoneStep('verify');
        startCooldown();
      });
    });
  }

  function handleOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const token = form.get('token') as string;

    setError(null);
    startTransition(async () => {
      const result = await verifyPhoneOtp({ phone: phoneNumber, token });
      handleResult(result, () => {
        setTimeout(() => router.push('/dashboard'), 400);
      });
    });
  }

  function handleResendOtp() {
    if (resendCooldown > 0) return; // Sécurité supplémentaire
    setError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await signInWithPhone({ phone: phoneNumber });
      handleResult(result, () => {
        setSuccessMessage('Nouveau code envoyé.');
        startCooldown();
      });
    });
  }

  // ============================================================
  // Rendu
  // ============================================================

  return (
    <div>
      {/* ── Onglets ── */}
      <div className="flex border-b border-slate-100">
        <TabButton
          active={mode === 'email'}
          onClick={() => switchMode('email')}
          disabled={busy}
        >
          <EmailIcon />
          Email
        </TabButton>
        <TabButton
          active={mode === 'phone'}
          onClick={() => switchMode('phone')}
          disabled={busy}
        >
          <PhoneIcon />
          Téléphone
        </TabButton>
      </div>

      {/* ── Contenu ── */}
      <div className="p-6 sm:p-8">
        {/* Messages */}
        {error && <AlertMessage type="error" message={error} />}
        {successMessage && <AlertMessage type="success" message={successMessage} />}

        {/* ─── Tab Email ─── */}
        {mode === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-5" noValidate>
            <Field
              label="Adresse email"
              error={fieldErrors.find((e) => e.field === 'email')?.message}
            >
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="avocat@cabinet.ne"
                disabled={busy}
                required
                className={inputClasses(fieldErrors.some((e) => e.field === 'email'))}
              />
            </Field>

            <Field
              label="Mot de passe"
              error={fieldErrors.find((e) => e.field === 'password')?.message}
            >
              <PasswordInput
                name="password"
                disabled={busy}
                hasError={fieldErrors.some((e) => e.field === 'password')}
              />
            </Field>

            <div className="flex items-center justify-end">
              <a
                href="/forgot-password"
                className="text-xs text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-800"
              >
                Mot de passe oublié ?
              </a>
            </div>

            <SubmitButton busy={busy} label="Se connecter" />
          </form>
        )}

        {/* ─── Tab Téléphone : Étape saisie ─── */}
        {mode === 'phone' && phoneStep === 'input' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-5" noValidate>
            <Field
              label="Numéro de téléphone"
              hint="Format Niger : 8 chiffres (ex : 90 12 34 56)"
              error={fieldErrors.find((e) => e.field === 'phone')?.message}
            >
              <div className="flex">
                {/* Indicatif fixe */}
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                  <NigerFlag />
                  <span className="ml-2">+227</span>
                </span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="90 12 34 56"
                  maxLength={11} // 8 chiffres + 3 espaces max
                  disabled={busy}
                  required
                  className={`${inputClasses(fieldErrors.some((e) => e.field === 'phone'))} rounded-l-none`}
                />
              </div>
            </Field>

            <SubmitButton busy={busy} label="Recevoir un code SMS" />

            <p className="text-center text-xs text-slate-400">
              Un code à 6 chiffres sera envoyé par SMS.
            </p>
          </form>
        )}

        {/* ─── Tab Téléphone : Étape vérification OTP ─── */}
        {mode === 'phone' && phoneStep === 'verify' && (
          <form onSubmit={handleOtpSubmit} className="space-y-5" noValidate>
            {/* Indicateur du numéro */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-600">
                Code envoyé au{' '}
                <span className="font-mono font-medium text-slate-900">
                  +227 {formatDisplay(phoneNumber)}
                </span>
              </p>
            </div>

            <Field
              label="Code de vérification"
              error={fieldErrors.find((e) => e.field === 'token')?.message}
            >
              <OtpInput name="token" disabled={busy} />
            </Field>

            <SubmitButton busy={busy} label="Vérifier" />

            <div className="flex items-center justify-center gap-3 text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={busy || resendCooldown > 0}
                className="text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-800 disabled:no-underline disabled:opacity-50"
              >
                {resendCooldown > 0
                  ? `Renvoyer dans ${resendCooldown}s`
                  : 'Renvoyer le code'}
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => {
                  setPhoneStep('input');
                  setError(null);
                  setSuccessMessage(null);
                }}
                disabled={busy}
                className="text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-800 disabled:opacity-50"
              >
                Changer de numéro
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Sous-composants
// ============================================================

/** Bouton d'onglet */
function TabButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all ${
        active
          ? 'border-b-2 border-slate-900 text-slate-900'
          : 'border-b-2 border-transparent text-slate-400 hover:text-slate-600'
      } disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

/** Champ avec label, hint et erreur */
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Input mot de passe avec toggle visibilité */
function PasswordInput({
  name,
  disabled,
  hasError,
}: {
  name: string;
  disabled: boolean;
  hasError: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete="current-password"
        placeholder="••••••••"
        disabled={disabled}
        required
        className={`${inputClasses(hasError)} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

/** Input OTP — 6 champs individuels avec auto-focus */
function OtpInput({ name, disabled }: { name: string; disabled: boolean }) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hiddenRef = useRef<HTMLInputElement | null>(null);

  // Sync la valeur cachée
  useEffect(() => {
    if (hiddenRef.current) {
      hiddenRef.current.value = digits.join('');
    }
  }, [digits]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Gestion du collage complet
      if (value.length > 1) {
        const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
        const newDigits = [...digits];
        pasted.forEach((d, i) => {
          if (index + i < 6) newDigits[index + i] = d;
        });
        setDigits(newDigits);
        const nextIndex = Math.min(index + pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
        return;
      }

      const digit = value.replace(/\D/g, '');
      const newDigits = [...digits];
      newDigits[index] = digit;
      setDigits(newDigits);

      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  return (
    <div>
      <input type="hidden" name={name} ref={hiddenRef} />
      <div className="flex justify-center gap-2.5">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className="h-12 w-11 rounded-lg border border-slate-200 bg-white text-center text-lg font-semibold text-slate-900 shadow-sm transition-all focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50 disabled:text-slate-400"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
          />
        ))}
      </div>
    </div>
  );
}

/** Bouton de soumission avec spinner */
function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="relative flex h-11 w-full items-center justify-center rounded-lg bg-slate-900 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:opacity-60"
    >
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </span>
      )}
      <span className={busy ? 'invisible' : ''}>{label}</span>
    </button>
  );
}

/** Message d'alerte */
function AlertMessage({
  type,
  message,
}: {
  type: 'error' | 'success';
  message: string;
}) {
  return (
    <div
      role="alert"
      className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
        type === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      {message}
    </div>
  );
}

// ============================================================
// Icônes & utilitaires
// ============================================================

function inputClasses(hasError: boolean): string {
  const base =
    'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';
  return hasError
    ? `${base} border-red-300 focus:border-red-400 focus:ring-red-500/20`
    : `${base} border-slate-200 focus:border-slate-300 focus:ring-slate-900/10`;
}

function formatDisplay(phone: string): string {
  if (phone.length === 8) {
    return `${phone.slice(0, 2)} ${phone.slice(2, 4)} ${phone.slice(4, 6)} ${phone.slice(6, 8)}`;
  }
  return phone;
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
      <path d="M2 5l6 4 6-4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="1.5" width="8" height="13" rx="1.5" />
      <line x1="7" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.59 6.59a2 2 0 002.82 2.82" />
      <path d="M10.74 10.74A6.5 6.5 0 018 12.5C4 12.5 1.5 8 1.5 8a11.7 11.7 0 013.26-3.74m2.08-1.12A6 6 0 018 3.5c4 0 6.5 4.5 6.5 4.5a11.7 11.7 0 01-1.76 2.24" />
      <line x1="1.5" y1="1.5" x2="14.5" y2="14.5" />
    </svg>
  );
}

/** Mini drapeau Niger (bandes horizontales orange/blanc/vert + rond orange) */
function NigerFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" className="rounded-sm shadow-sm">
      <rect width="20" height="14" rx="1" fill="#fff" />
      <rect width="20" height="4.67" fill="#E05206" />
      <rect y="9.33" width="20" height="4.67" fill="#0DB02B" />
      <circle cx="10" cy="7" r="1.8" fill="#E05206" />
    </svg>
  );
}
