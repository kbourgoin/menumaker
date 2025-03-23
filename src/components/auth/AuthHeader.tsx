
import { ReactNode } from "react";

interface AuthHeaderProps {
  children?: ReactNode;
}

const AuthHeader = ({ children }: AuthHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-serif font-medium text-terracotta-700">Menu Maker</h1>
      <p className="text-muted-foreground mt-2">Track, plan and remember your favorite meals</p>
      {children}
    </div>
  );
};

export default AuthHeader;
