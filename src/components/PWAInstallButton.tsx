import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export const PWAInstallButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('PWA Install Button Debug:', {
      isInstallable,
      isInstalled,
      shouldShow: !isInstalled && isInstallable
    });
  }

  // In development, show the button even if not installable (for testing)
  const shouldShow = import.meta.env.DEV ? true : (!isInstalled && isInstallable);
  
  if (!shouldShow) {
    return null;
  }

  return (
    <Button 
      onClick={installApp}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Install App</span>
    </Button>
  );
};