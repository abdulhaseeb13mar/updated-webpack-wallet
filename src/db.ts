import { PermissionRequest } from "./types";
import Dexie from "dexie";

function keyBy(
  permissionsArray: Array<PermissionRequest>,
  keyOrKeysArray: keyof PermissionRequest | Array<keyof PermissionRequest>,
  separator = "_"
): Record<string, PermissionRequest> {
  return permissionsArray.reduce((acc, current) => {
    const key = Array.isArray(keyOrKeysArray)
      ? keyOrKeysArray.map(k => current[k]).join(separator)
      : current[keyOrKeysArray];
    acc[key] = current;
    return acc;
  }, {} as Record<string, PermissionRequest>);
}

export class ProviderBridgeServiceDatabase extends Dexie {
  private dAppPermissions!: Dexie.Table<PermissionRequest, string>;

  constructor() {
    super("tally/provider-bridge-service");
  }

  async getAllPermission(): Promise<Record<string, PermissionRequest>> {
    return this.dAppPermissions
      .toArray()
      .then(permissionsArray =>
        keyBy(permissionsArray, ["origin", "accountAddress"])
      );
  }

  async setPermission(
    permission: PermissionRequest
  ): Promise<string | undefined> {
    return this.dAppPermissions.put(permission);
  }

  async deletePermission(
    origin: string,
    accountAddress: string
  ): Promise<number> {
    return this.dAppPermissions.where({ origin, accountAddress }).delete();
  }

  async checkPermission(
    origin: string,
    accountAddress: string
  ): Promise<PermissionRequest | undefined> {
    return this.dAppPermissions.get({ origin, accountAddress });
  }
}

export async function getOrCreateDB(): Promise<ProviderBridgeServiceDatabase> {
  return new ProviderBridgeServiceDatabase();
}
