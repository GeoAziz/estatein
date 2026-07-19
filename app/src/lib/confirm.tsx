import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import ConfirmDialog, { type ConfirmDialogProps } from "../components/ConfirmDialog";

type ConfirmOptions = Omit<ConfirmDialogProps, "onConfirm" | "onCancel">;

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<string | boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: string | boolean) => void>(() => {});

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<string | boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function handleConfirm(promptValue?: string) {
    resolver.current(promptValue ?? true);
    setOptions(null);
  }
  function handleCancel() {
    resolver.current(false);
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && <ConfirmDialog {...options} onConfirm={handleConfirm} onCancel={handleCancel} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}
