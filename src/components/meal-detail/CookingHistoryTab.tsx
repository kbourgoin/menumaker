
import { format, parseISO } from "date-fns";
import { Clock, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CookingHistoryTabProps {
  history: { date: string; notes?: string }[];
}

const CookingHistoryTab = ({ history }: CookingHistoryTabProps) => {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (e) {
      console.error("Error parsing date", e);
      return "Invalid date";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Cooking History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={index} className="p-4 border rounded-md">
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatDate(entry.date)}
                </div>
                {entry.notes && (
                  <div className="mt-2 flex items-start">
                    <MessageSquare className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
                    <div className="text-sm">{entry.notes}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No cooking history recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CookingHistoryTab;
