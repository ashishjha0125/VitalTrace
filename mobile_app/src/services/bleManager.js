import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';

const SERVICE_UUID = "91bad492-b950-4226-aa2b-4ede9fa42f59";
const CHARACTERISTIC_UUID = "cba1d466-344c-4be3-ab2d-ad559a9412f5";
const DEVICE_NAME = "VitalTrace_ECG";

class BleService {
  constructor() {
    try {
      this.manager = new BleManager();
      this.isMock = false;
    } catch (e) {
      console.warn("BLE Native Module not found. Running in MOCK mode for UI testing.");
      this.manager = null;
      this.isMock = true;
    }
    this.device = null;
    this.isScanning = false;
    this.scanTimeout = null;
  }

  // ===== PERMISSIONS (Android 12+ Fix) =====
  async requestPermissions() {
    if (this.isMock) return true;

    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;

      try {
        if (apiLevel >= 31) {
          // Android 12+ needs BLUETOOTH_SCAN + BLUETOOTH_CONNECT
          const results = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]);

          const allGranted =
            results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
            results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;

          console.log('[BLE] Android 12+ permissions:', allGranted ? 'GRANTED' : 'DENIED', results);
          return allGranted;
        } else {
          // Android 11 and below just needs Location
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          console.log('[BLE] Location permission:', granted);
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.error('[BLE] Permission request error:', err);
        return false;
      }
    }

    // iOS permissions are handled by Info.plist
    return true;
  }

  // ===== SCAN FOR DEVICES =====
  startDeviceScan(onDeviceFound, onError) {
    if (this.isMock) {
      setTimeout(() => {
        onDeviceFound({
          name: 'VitalTrace_ECG (MOCK)',
          id: 'MOCK-ID',
          connect: () => Promise.resolve(this.getMockDevice()),
        });
      }, 2000);
      return;
    }

    // Stop any existing scan first
    if (this.isScanning) {
      this.manager.stopDeviceScan();
    }

    this.isScanning = true;
    let deviceFound = false;

    console.log('[BLE] Starting scan for', DEVICE_NAME, '...');

    // Auto-stop scan after 15 seconds
    this.scanTimeout = setTimeout(() => {
      if (!deviceFound) {
        console.log('[BLE] Scan timeout - no device found');
        this.manager.stopDeviceScan();
        this.isScanning = false;
        if (onError) onError('Scan timeout. Make sure ESP32 is powered on.');
      }
    }, 15000);

    this.manager.startDeviceScan(
      [SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('[BLE] Scan error:', error.message, 'Code:', error.errorCode);
          this.isScanning = false;
          if (this.scanTimeout) clearTimeout(this.scanTimeout);

          // Common error: BLE not enabled
          if (error.errorCode === 102) {
            if (onError) onError('Bluetooth is turned OFF. Please enable Bluetooth.');
          } else {
            if (onError) onError(`Scan error: ${error.message}`);
          }
          return;
        }

        if (device && !deviceFound) {
          const name = device.name || device.localName || '';
          console.log('[BLE] Found device:', name, '| ID:', device.id);

          // Match device name (case-insensitive, partial match)
          if (
            name === DEVICE_NAME ||
            name.toLowerCase().includes('vitaltrace') ||
            name.toLowerCase().includes('ecg')
          ) {
            deviceFound = true;
            this.isScanning = false;
            this.manager.stopDeviceScan();
            if (this.scanTimeout) clearTimeout(this.scanTimeout);
            console.log('[BLE] ✅ Target device found:', name);
            onDeviceFound(device);
          }
        }
      }
    );
  }

  // ===== CONNECT TO DEVICE =====
  async connectToDevice(device, onDataReceived) {
    if (this.isMock) {
      this.device = this.getMockDevice();
      this.device.monitorCharacteristicForService(null, null, (err, char) => {
        onDataReceived(Buffer.from(char.value, 'base64').toString());
      });
      return true;
    }

    try {
      // Make sure scan is stopped
      this.manager.stopDeviceScan();
      this.isScanning = false;

      console.log('[BLE] Connecting to device:', device.id);

      // Connect with timeout (10 seconds)
      const connectedDevice = await device.connect({
        timeout: 10000,
        requestMTU: 512,
      });

      console.log('[BLE] ✅ Connected! Discovering services...');

      // Discover services and characteristics
      await connectedDevice.discoverAllServicesAndCharacteristics();
      this.device = connectedDevice;

      console.log('[BLE] ✅ Services discovered. Starting notifications...');

      // Monitor disconnection
      this.manager.onDeviceDisconnected(device.id, (error, disconnectedDevice) => {
        console.log('[BLE] ⚠️ Device disconnected:', error?.message || 'clean disconnect');
        this.device = null;
      });

      // Start reading ECG data via notifications
      connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('[BLE] Notification error:', error.message);
            return;
          }
          if (characteristic && characteristic.value) {
            try {
              const decodedData = Buffer.from(characteristic.value, 'base64').toString('ascii');
              onDataReceived(decodedData);
            } catch (decodeErr) {
              console.error('[BLE] Decode error:', decodeErr.message);
            }
          }
        }
      );

      console.log('[BLE] ✅ Monitoring started! Streaming ECG data...');
      return true;
    } catch (e) {
      console.error('[BLE] ❌ Connection failed:', e.message, 'Code:', e.errorCode);

      // Specific error messages
      if (e.errorCode === 201) {
        console.error('[BLE] Device not found or out of range');
      } else if (e.errorCode === 205) {
        console.error('[BLE] Service not found on device. Check UUIDs.');
      }

      return false;
    }
  }

  // ===== MOCK DEVICE (for testing without hardware) =====
  getMockDevice() {
    let mockInterval = null;
    // Generate realistic-looking ECG mock data
    let phase = 0;
    return {
      discoverAllServicesAndCharacteristics: () => Promise.resolve(),
      monitorCharacteristicForService: (s, c, cb) => {
        mockInterval = setInterval(() => {
          phase += 0.05;
          // Simulate ECG-like waveform
          const baseline = 2048;
          const noise = (Math.random() - 0.5) * 50;
          const pWave = Math.sin(phase) * 100;
          const qrsSpike = (Math.sin(phase * 5) > 0.95) ? 800 : 0;
          const tWave = Math.sin(phase * 0.8) * 80;
          const mockVal = Math.floor(baseline + pWave + qrsSpike + tWave + noise);
          const clamped = Math.max(0, Math.min(4095, mockVal));
          const base64 = Buffer.from(clamped.toString()).toString('base64');
          cb(null, { value: base64 });
        }, 5); // 200Hz
      },
      cancelConnection: () => {
        if (mockInterval) clearInterval(mockInterval);
        return Promise.resolve();
      },
    };
  }

  // ===== DISCONNECT =====
  disconnect() {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }

    if (this.isScanning) {
      try { this.manager?.stopDeviceScan(); } catch (e) {}
      this.isScanning = false;
    }

    if (this.device) {
      if (this.isMock) {
        this.device.cancelConnection();
        this.device = null;
      } else {
        try {
          this.device.cancelConnection();
        } catch (e) {
          console.warn('[BLE] Disconnect error:', e.message);
        }
        this.device = null;
      }
    }

    console.log('[BLE] 🔌 Disconnected');
  }

  // ===== DESTROY (cleanup) =====
  destroy() {
    this.disconnect();
    if (this.manager && !this.isMock) {
      this.manager.destroy();
    }
  }
}

export const bleService = new BleService();
