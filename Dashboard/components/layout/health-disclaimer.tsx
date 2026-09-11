import { Alert } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export function HealthDisclaimer() {
  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50/50 dark:bg-amber-950/20">
      <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <p className="text-xs text-amber-700 dark:text-amber-300">
        Information is for reference only. Consult a physician for treatment decisions.
      </p>
    </Alert>
  );
}
