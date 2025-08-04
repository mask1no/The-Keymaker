import { logger } from '@/lib/logger';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import path from 'path';

export interface LaunchPreset {
  name: string;
  timestamp: number;
  config: {
    tokenName: string;
    tokenSymbol: string;
    tokenDescription: string;
    tokenImage?: string;
    platform: string;
    totalSupply: number;
    decimals: number;
    
    // Launch settings
    bundleSize: number;
    tipAmount: number;
    priorityFee: number;
    autoSellDelay: number;
    
    // Wallet allocation
    devAllocation: number;
    lpAllocation: number;
    
    // Distribution
    buyAmounts: {
      min: number;
      max: number;
    };
    
    // Social links
    telegram?: string;
    twitter?: string;
    website?: string;
  };
}

class PresetService {
  private presetsDir: string;

  constructor() {
    // In browser context, we'll use localStorage instead of filesystem
    this.presetsDir = '';
  }

  async savePreset(preset: LaunchPreset): Promise<string> {
    try {
      const presetId = `preset_${Date.now()}_${preset.name.toLowerCase().replace(/\s+/g, '_')}`;
      
      // In browser, save to localStorage
      if (typeof window !== 'undefined') {
        const presets = this.loadPresetsFromStorage();
        presets[presetId] = preset;
        localStorage.setItem('keymaker_presets', JSON.stringify(presets));
        logger.info(`Preset saved: ${preset.name}`);
        return presetId;
      }
      
      // Server-side implementation would save to file system
      throw new Error('Server-side preset saving not implemented');
    } catch (error) {
      logger.error('Failed to save preset:', error);
      throw error;
    }
  }

  async loadPreset(presetId: string): Promise<LaunchPreset | null> {
    try {
      if (typeof window !== 'undefined') {
        const presets = this.loadPresetsFromStorage();
        return presets[presetId] || null;
      }
      
      throw new Error('Server-side preset loading not implemented');
    } catch (error) {
      logger.error('Failed to load preset:', error);
      return null;
    }
  }

  async listPresets(): Promise<{ id: string; preset: LaunchPreset }[]> {
    try {
      if (typeof window !== 'undefined') {
        const presets = this.loadPresetsFromStorage();
        return Object.entries(presets).map(([id, preset]) => ({ id, preset }));
      }
      
      return [];
    } catch (error) {
      logger.error('Failed to list presets:', error);
      return [];
    }
  }

  async deletePreset(presetId: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const presets = this.loadPresetsFromStorage();
        if (presets[presetId]) {
          delete presets[presetId];
          localStorage.setItem('keymaker_presets', JSON.stringify(presets));
          return true;
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to delete preset:', error);
      return false;
    }
  }

  generateShareLink(presetId: string, preset: LaunchPreset): string {
    const presetData = {
      id: presetId,
      ...preset
    };
    
    const encodedData = Buffer.from(JSON.stringify(presetData)).toString('base64');
    return `keymaker://preset/${encodedData}`;
  }

  parseShareLink(link: string): { id: string; preset: LaunchPreset } | null {
    try {
      const match = link.match(/^keymaker:\/\/preset\/(.+)$/);
      if (!match) {
        throw new Error('Invalid preset link format');
      }
      
      const encodedData = match[1];
      const decodedData = Buffer.from(encodedData, 'base64').toString('utf8');
      const data = JSON.parse(decodedData);
      
      return {
        id: data.id,
        preset: {
          name: data.name,
          timestamp: data.timestamp,
          config: data.config
        }
      };
    } catch (error) {
      logger.error('Failed to parse preset link:', error);
      return null;
    }
  }

  exportPreset(preset: LaunchPreset): string {
    return JSON.stringify(preset, null, 2);
  }

  importPreset(jsonData: string): LaunchPreset {
    try {
      const preset = JSON.parse(jsonData);
      
      // Validate required fields
      if (!preset.name || !preset.config || !preset.config.tokenName) {
        throw new Error('Invalid preset format');
      }
      
      return preset;
    } catch (error) {
      logger.error('Failed to import preset:', error);
      throw new Error('Invalid preset data');
    }
  }

  private loadPresetsFromStorage(): Record<string, LaunchPreset> {
    try {
      const stored = localStorage.getItem('keymaker_presets');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
}

export const presetService = new PresetService();