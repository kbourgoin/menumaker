import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { checkMigrationStatus, migrateCuisinesToTags, MigrationStats } from "@/utils/cuisineToTagMigration";

/**
 * Component that automatically checks if cuisine to tag migration is needed
 * and provides a button to trigger the migration
 */
export const MigrationTrigger = () => {
  const [migrationStatus, setMigrationStatus] = useState<{
    needsMigration: boolean;
    cuisineTagCount: number;
    isChecking: boolean;
    isRunning: boolean;
    stats?: MigrationStats;
    error?: string;
  }>({
    needsMigration: false,
    cuisineTagCount: 0,
    isChecking: true,
    isRunning: false,
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkMigrationStatus();
        setMigrationStatus(prev => ({
          ...prev,
          needsMigration: status.needsMigration,
          cuisineTagCount: status.cuisineTagCount,
          isChecking: false,
        }));
      } catch (error) {
        setMigrationStatus(prev => ({
          ...prev,
          isChecking: false,
          error: error instanceof Error ? error.message : "Failed to check migration status",
        }));
      }
    };

    checkStatus();
  }, []);

  const runMigration = async () => {
    setMigrationStatus(prev => ({ ...prev, isRunning: true, error: undefined }));
    
    try {
      const stats = await migrateCuisinesToTags();
      setMigrationStatus(prev => ({
        ...prev,
        isRunning: false,
        stats,
        needsMigration: false,
        error: stats.errors.length > 0 ? stats.errors.join(", ") : undefined,
      }));
    } catch (error) {
      setMigrationStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : "Migration failed",
      }));
    }
  };

  // Don't show anything if migration is not needed
  if (migrationStatus.isChecking) {
    return null; // Loading silently
  }

  if (!migrationStatus.needsMigration && !migrationStatus.stats) {
    return null; // Migration already complete, nothing to show
  }

  return (
    <div className="space-y-4">
      {migrationStatus.needsMigration && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>Cuisine System Update Available</strong>
              </p>
              <p>
                We've improved the cuisine system! Click below to migrate your cuisines to the new tag-based system. 
                This will preserve all your existing data while enabling new features.
              </p>
              <Button 
                onClick={runMigration} 
                disabled={migrationStatus.isRunning}
                size="sm"
                className="mt-2"
              >
                {migrationStatus.isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  "Migrate Cuisines"
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {migrationStatus.stats && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>Migration Complete!</strong>
              </p>
              <ul className="text-sm space-y-1">
                <li>✅ Created {migrationStatus.stats.cuisineTagsCreated} cuisine tags</li>
                <li>✅ Updated {migrationStatus.stats.dishesUpdated} dishes</li>
                <li>✅ Created {migrationStatus.stats.dishTagRelationsCreated} dish-cuisine relationships</li>
              </ul>
              {migrationStatus.stats.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-destructive">
                    Some issues occurred: {migrationStatus.stats.errors.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {migrationStatus.error && !migrationStatus.stats && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Migration failed: {migrationStatus.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};