import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/ui/usePWAInstall";
import { debugLog } from "@/utils/logger";

export const PWAInstallButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  // Debug logging in development
  debugLog('PWA Install Button Debug', 'PWA', {
    isInstallable,
    isInstalled,
    shouldShow: !isInstalled && isInstallable
  });

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