// Simple in-memory event bus for logging system activities
import { secureId } from "./secure";

export type EventSeverity = "info" | "warning" | "error" | "critical";
export type EntityType = "asset" | "license" | "vendor" | "user";
export type EventValue = string | number | boolean | null | undefined;

export interface SystemEvent {
  id: string;
  timestamp: string;
  severity: EventSeverity;
  entityType: EntityType;
  entityId: string;
  action: string;
  user: string;
  details: string;
  metadata: Record<string, any>;
  previousValue?: EventValue;
  changedValue?: EventValue;
}

class EventBus {
  private events: SystemEvent[] = [];
  private listeners: ((event: SystemEvent) => void)[] = [];

  logEvent(
    severity: EventSeverity,
    entityType: EntityType,
    entityId: string,
    action: string,
    user: string,
    details: string,
    options: {
      metadata?: Record<string, any>;
      previousValue?: EventValue;
      changedValue?: EventValue;
    } = {}
  ): SystemEvent {
    const event: SystemEvent = {
      id: `EVT-${Date.now()}-${secureId("", 16)}`,
      timestamp: new Date().toISOString(),
      severity,
      entityType,
      entityId,
      action,
      user,
      details,
      metadata: options.metadata || {},
      previousValue: options.previousValue,
      changedValue: options.changedValue,
    };

    this.events.unshift(event); // Add to beginning for chronological order
    this.notifyListeners(event);

    console.log(
      `[EventBus] ${severity.toUpperCase()}: ${details}`,
      options.metadata
    );

    return event;
  }

  getEvents(): SystemEvent[] {
    return [...this.events];
  }

  getEventsByEntityType(entityType: EntityType): SystemEvent[] {
    return this.events.filter((event) => event.entityType === entityType);
  }

  getEventsBySeverity(severity: EventSeverity): SystemEvent[] {
    return this.events.filter((event) => event.severity === severity);
  }

  subscribe(listener: (event: SystemEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(event: SystemEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  clearEvents(): void {
    this.events = [];
  }
}

// Export singleton instance
export const eventBus = new EventBus();

// Helper functions for common event types
export function logAssetCreated(
  assetId: string,
  assetName: string,
  user: string,
  metadata: Record<string, any> = {}
) {
  return eventBus.logEvent(
    "info",
    "asset",
    assetId,
    "asset.created",
    user,
    `New asset created: ${assetName}`,
    { metadata }
  );
}

export function logAssetUpdated(
  assetId: string,
  assetName: string,
  user: string,
  changes: Record<string, any> = {},
  previousValue?: EventValue,
  changedValue?: EventValue
) {
  return eventBus.logEvent(
    "info",
    "asset",
    assetId,
    "asset.updated",
    user,
    `Asset updated: ${assetName}`,
    { metadata: { changes }, previousValue, changedValue }
  );
}

export function logAssetDeleted(
  assetId: string,
  assetName: string,
  user: string
) {
  return eventBus.logEvent(
    "warning",
    "asset",
    assetId,
    "asset.deleted",
    user,
    `Asset deleted: ${assetName}`,
    { metadata: {} }
  );
}

export function logLicenseCreated(
  licenseId: string,
  licenseName: string,
  user: string,
  metadata: Record<string, any> = {}
) {
  return eventBus.logEvent(
    "info",
    "license",
    licenseId,
    "license.created",
    user,
    `New license added: ${licenseName}`,
    { metadata }
  );
}

export function logLicenseExpiring(
  licenseId: string,
  licenseName: string,
  daysUntilExpiry: number
) {
  return eventBus.logEvent(
    "warning",
    "license",
    licenseId,
    "license.expiring_soon",
    "system",
    `License expiring in ${daysUntilExpiry} days: ${licenseName}`,
    { metadata: { daysUntilExpiry } }
  );
}

export function logVendorCreated(
  vendorId: string,
  vendorName: string,
  user: string,
  metadata: Record<string, any> = {}
) {
  return eventBus.logEvent(
    "info",
    "vendor",
    vendorId,
    "vendor.created",
    user,
    `New vendor added: ${vendorName}`,
    { metadata }
  );
}

export function logVendorUpdated(
  vendorId: string,
  vendorName: string,
  user: string,
  changes: Record<string, any> = {},
  previousValue?: EventValue,
  changedValue?: EventValue
) {
  return eventBus.logEvent(
    "info",
    "vendor",
    vendorId,
    "vendor.updated",
    user,
    `Vendor updated: ${vendorName}`,
    { metadata: { changes }, previousValue, changedValue }
  );
}
