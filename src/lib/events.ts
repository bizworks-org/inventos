// Simple in-memory event bus for logging system activities
import { secureId } from './secure';

export type EventSeverity = 'info' | 'warning' | 'error' | 'critical';
export type EntityType = 'asset' | 'license' | 'vendor' | 'user';

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
    metadata: Record<string, any> = {}
  ): SystemEvent {
    const event: SystemEvent = {
      id: `EVT-${Date.now()}-${secureId('', 5)}`,
      timestamp: new Date().toISOString(),
      severity,
      entityType,
      entityId,
      action,
      user,
      details,
      metadata
    };

    this.events.unshift(event); // Add to beginning for chronological order
    this.notifyListeners(event);
    
    console.log(`[EventBus] ${severity.toUpperCase()}: ${details}`, metadata);
    
    return event;
  }

  getEvents(): SystemEvent[] {
    return [...this.events];
  }

  getEventsByEntityType(entityType: EntityType): SystemEvent[] {
    return this.events.filter(event => event.entityType === entityType);
  }

  getEventsBySeverity(severity: EventSeverity): SystemEvent[] {
    return this.events.filter(event => event.severity === severity);
  }

  subscribe(listener: (event: SystemEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(event: SystemEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  clearEvents(): void {
    this.events = [];
  }
}

// Export singleton instance
export const eventBus = new EventBus();

// Helper functions for common event types
export function logAssetCreated(assetId: string, assetName: string, user: string, metadata: Record<string, any> = {}) {
  return eventBus.logEvent(
    'info',
    'asset',
    assetId,
    'asset.created',
    user,
    `New asset created: ${assetName}`,
    metadata
  );
}

export function logAssetUpdated(assetId: string, assetName: string, user: string, changes: Record<string, any> = {}) {
  return eventBus.logEvent(
    'info',
    'asset',
    assetId,
    'asset.updated',
    user,
    `Asset updated: ${assetName}`,
    { changes }
  );
}

export function logAssetDeleted(assetId: string, assetName: string, user: string) {
  return eventBus.logEvent(
    'warning',
    'asset',
    assetId,
    'asset.deleted',
    user,
    `Asset deleted: ${assetName}`,
    {}
  );
}

export function logLicenseCreated(licenseId: string, licenseName: string, user: string, metadata: Record<string, any> = {}) {
  return eventBus.logEvent(
    'info',
    'license',
    licenseId,
    'license.created',
    user,
    `New license added: ${licenseName}`,
    metadata
  );
}

export function logLicenseExpiring(licenseId: string, licenseName: string, daysUntilExpiry: number) {
  return eventBus.logEvent(
    'warning',
    'license',
    licenseId,
    'license.expiring_soon',
    'system',
    `License expiring in ${daysUntilExpiry} days: ${licenseName}`,
    { daysUntilExpiry }
  );
}

export function logVendorCreated(vendorId: string, vendorName: string, user: string, metadata: Record<string, any> = {}) {
  return eventBus.logEvent(
    'info',
    'vendor',
    vendorId,
    'vendor.created',
    user,
    `New vendor added: ${vendorName}`,
    metadata
  );
}

export function logVendorUpdated(vendorId: string, vendorName: string, user: string, changes: Record<string, any> = {}) {
  return eventBus.logEvent(
    'info',
    'vendor',
    vendorId,
    'vendor.updated',
    user,
    `Vendor updated: ${vendorName}`,
    { changes }
  );
}
