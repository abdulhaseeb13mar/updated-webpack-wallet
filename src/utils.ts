import Dexie from "dexie";
import { PermissionRequest } from "./types";

export class ProviderBridgeServiceDatabase extends Dexie {
  async setPermission(
    permission: PermissionRequest
  ): Promise<string | undefined> {
    let dAppPermissions!: Dexie.Table<PermissionRequest, string>;
    console.log("SET PERMISSION CALLED");
    return dAppPermissions.put(permission);
  }
}
