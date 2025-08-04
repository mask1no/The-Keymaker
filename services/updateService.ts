import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';

const CURRENT_VERSION = '1.1.0';
const UPDATE_CHECK_URL = '/api/version';
const UPDATE_CHECK_INTERVAL = 3600000; // 1 hour

interface VersionInfo {
  latest: string;
  current: string;
  updateAvailable: boolean;
  downloadUrl?: string;
  releaseNotes?: string[];
}

class UpdateService {
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheck: number = 0;

  async checkForUpdate(): Promise<VersionInfo | null> {
    try {
      const response = await fetch(UPDATE_CHECK_URL);
      if (!response.ok) {
        throw new Error('Failed to check for updates');
      }

      const data = await response.json();
      const updateInfo: VersionInfo = {
        current: CURRENT_VERSION,
        latest: data.version || CURRENT_VERSION,
        updateAvailable: this.isNewerVersion(data.version || CURRENT_VERSION, CURRENT_VERSION),
        downloadUrl: data.downloadUrl,
        releaseNotes: data.releaseNotes
      };

      this.lastCheck = Date.now();
      
      if (updateInfo.updateAvailable) {
        logger.info('Update available:', updateInfo);
        this.notifyUpdate(updateInfo);
      }

      return updateInfo;
    } catch (error) {
      logger.error('Failed to check for updates:', error);
      return null;
    }
  }

  private isNewerVersion(latest: string, current: string): boolean {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (latestParts[i] > currentParts[i]) return true;
      if (latestParts[i] < currentParts[i]) return false;
    }

    return false;
  }

  private notifyUpdate(info: VersionInfo) {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <div className="font-semibold">Update Available!</div>
        <div className="text-sm">Version {info.latest} is now available</div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              if (info.downloadUrl) {
                window.open(info.downloadUrl, '_blank');
              }
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 bg-aqua text-black rounded text-sm font-medium hover:bg-aqua/80"
          >
            Download
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
          >
            Later
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'bottom-right',
      style: {
        background: '#1a1a1a',
        color: '#fff',
        border: '1px solid #06b6d4'
      }
    });
  }

  startAutoCheck() {
    // Check on start
    this.checkForUpdate();

    // Set up periodic check
    this.checkInterval = setInterval(() => {
      this.checkForUpdate();
    }, UPDATE_CHECK_INTERVAL);
  }

  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getVersion(): string {
    return CURRENT_VERSION;
  }

  getLastCheckTime(): number {
    return this.lastCheck;
  }
}

export const updateService = new UpdateService();