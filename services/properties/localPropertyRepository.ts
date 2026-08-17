import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_PROPERTIES } from '@/constants/demo';
import { AppError } from '@/lib/errors';
import type { Property, PropertyDraft } from '@/types/property';
import { logger } from '../logger';
import type { PropertyRepository } from './types';

/**
 * On-device property storage for demo mode.
 *
 * Seeded once with the sample portfolio so the app is immediately useful,
 * then fully editable: adding, editing and deleting all persist, and data
 * survives sign-out/sign-in and app restarts.
 */

const STORAGE_KEY = 'propertypilot.demo.properties';
const SEEDED_KEY = 'propertypilot.demo.seeded';

function newId(): string {
  // Enough entropy for a local demo store; real ids come from Postgres.
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class LocalPropertyRepository implements PropertyRepository {
  private async readAll(): Promise<Property[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw !== null) return JSON.parse(raw) as Property[];

      // First run: seed the demo portfolio exactly once, so a user who
      // deletes every sample property does not get them back.
      const alreadySeeded = await AsyncStorage.getItem(SEEDED_KEY);
      if (alreadySeeded) return [];

      await this.writeAll(DEMO_PROPERTIES);
      await AsyncStorage.setItem(SEEDED_KEY, 'true');
      return DEMO_PROPERTIES;
    } catch (error) {
      logger.error('Failed to read demo properties', error);
      throw new AppError('storage', 'We could not load your properties on this device.', error);
    }
  }

  private async writeAll(properties: Property[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    } catch (error) {
      logger.error('Failed to write demo properties', error);
      throw new AppError('storage', 'We could not save your changes on this device.', error);
    }
  }

  async list(userId: string): Promise<Property[]> {
    const all = await this.readAll();
    return all
      .map((property) => ({ ...property, userId }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(userId: string, propertyId: string): Promise<Property | null> {
    const all = await this.list(userId);
    return all.find((property) => property.id === propertyId) ?? null;
  }

  async create(userId: string, draft: PropertyDraft): Promise<Property> {
    const all = await this.readAll();
    const now = new Date().toISOString();

    const property: Property = {
      ...draft,
      id: newId(),
      userId,
      createdAt: now,
      updatedAt: now,
    };

    await this.writeAll([...all, property]);
    return property;
  }

  async update(userId: string, propertyId: string, draft: PropertyDraft): Promise<Property> {
    const all = await this.readAll();
    const existing = all.find((property) => property.id === propertyId);

    if (!existing) {
      throw new AppError('not_found', 'We could not find that property.');
    }

    const updated: Property = {
      ...existing,
      ...draft,
      id: propertyId,
      userId,
      updatedAt: new Date().toISOString(),
    };

    await this.writeAll(all.map((property) => (property.id === propertyId ? updated : property)));
    return updated;
  }

  async remove(_userId: string, propertyId: string): Promise<void> {
    const all = await this.readAll();
    await this.writeAll(all.filter((property) => property.id !== propertyId));
  }

  /** Development helper: restore the sample portfolio. */
  async resetToDemoData(): Promise<void> {
    await this.writeAll(DEMO_PROPERTIES);
    await AsyncStorage.setItem(SEEDED_KEY, 'true');
  }
}
