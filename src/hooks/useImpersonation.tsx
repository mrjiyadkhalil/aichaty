import { createContext, useContext, useState, ReactNode } from "react";

interface ImpersonationContextType {
  impersonatedUserId: string | null;
  impersonatedUserName: string | null;
  startImpersonation: (userId: string, displayName: string) => void;
  stopImpersonation: () => void;
  isImpersonating: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  impersonatedUserId: null,
  impersonatedUserName: null,
  startImpersonation: () => {},
  stopImpersonation: () => {},
  isImpersonating: false,
});

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const [impersonatedUserName, setImpersonatedUserName] = useState<string | null>(null);

  const startImpersonation = (userId: string, displayName: string) => {
    setImpersonatedUserId(userId);
    setImpersonatedUserName(displayName);
  };

  const stopImpersonation = () => {
    setImpersonatedUserId(null);
    setImpersonatedUserName(null);
  };

  return (
    <ImpersonationContext.Provider value={{
      impersonatedUserId,
      impersonatedUserName,
      startImpersonation,
      stopImpersonation,
      isImpersonating: !!impersonatedUserId,
    }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export const useImpersonation = () => useContext(ImpersonationContext);
