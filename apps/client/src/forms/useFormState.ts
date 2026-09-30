import { useState } from "react";
import { useFeedback } from "../feedback/feedbackContext";
import { toFieldErrors } from "./fieldErrors";
import { handleSubmitError } from "./submitErrors";

/** Keys of `V` that hold text, i.e. the ones a text input can edit. */
type TextKey<V> = { [K in keyof V]: V[K] extends string ? K : never }[keyof V] & string;

/** The shape of a Zod `safeParse` result. */
type ParseResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
    };

interface SubmitOptions {
  /** Title of the error dialog, e.g. "Couldn't save your profile". */
  title: string;
  /** API error codes that belong under one field, e.g. { email_taken: "email" }. */
  fieldByCode?: Record<string, string>;
}

interface FormState<V> {
  values: V;
  /** `{ field: message }`, shown under each input. */
  errors: Record<string, string>;
  submitting: boolean;
}

/**
 * A form's values, field errors and "submitting" flag in one state, plus the
 * submit flow every form shares: validate, send, then route a failure inline
 * (field errors) or to an error dialog (everything else).
 */
export function useFormState<V extends object>(initialValues: V | (() => V)) {
  const feedback = useFeedback();
  const [state, setState] = useState<FormState<V>>(() => ({
    values: typeof initialValues === "function" ? (initialValues as () => V)() : initialValues,
    errors: {},
    submitting: false,
  }));

  const setValues = (changes: Partial<V>) =>
    setState((current) => ({ ...current, values: { ...current.values, ...changes } }));
  const setErrors = (errors: Record<string, string>) =>
    setState((current) => ({ ...current, errors }));
  const set = (name: TextKey<V>) => (value: string) => setValues({ [name]: value } as Partial<V>);

  /** Props for a TextInputField. `errorKey` is where its error lives, when not the field name. */
  const field = (name: TextKey<V>, errorKey: string = name) => ({
    name,
    value: state.values[name] as string,
    onChange: (event: { target: { value: string } }) => set(name)(event.target.value),
    error: state.errors[errorKey],
  });

  /** Shows `parsed`'s issues, or sends its data. `send` should throw when the API refuses. */
  async function submit<T>(
    parsed: ParseResult<T>,
    send: (data: T) => Promise<void>,
    options: SubmitOptions,
  ): Promise<void> {
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setState((current) => ({ ...current, errors: {}, submitting: true }));
    try {
      await send(parsed.data);
    } catch (error) {
      handleSubmitError(error, { ...options, feedback, setFieldErrors: setErrors });
    } finally {
      setState((current) => ({ ...current, submitting: false }));
    }
  }

  return { ...state, set, setValues, setErrors, field, submit };
}
