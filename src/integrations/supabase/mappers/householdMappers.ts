import { DBHousehold } from "@/types/database";
import { Household } from "@/types/entities";

export function mapHouseholdFromDB(db: DBHousehold): Household {
  return {
    id: db.id,
    name: db.name,
    inviteCode: db.invite_code,
    createdBy: db.created_by,
    createdAt: db.created_at,
  };
}
