/*
 * VitalTrace ECG Monitor - ESP32 Firmware (v2.0 - Fixed BLE)
 * -----------------------------------------------------------
 * Hardware: ESP32 + AD8232
 * Connections:
 *   VCC    -> 3.3V
 *   GND    -> GND
 *   Output -> Pin 34 (Analog)
 *   LO+    -> Pin 25
 *   LO-    -> Pin 33
 *
 * FIXES:
 *   - BLE notification rate reduced to ~50Hz (was 200Hz, too fast)
 *   - Batched 4 samples per notification for full 200Hz data
 *   - Better advertising parameters for reliable connection
 *   - LED indicator for connection status
 *   - Leads-off detection sent via BLE
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

// Unique IDs (Must match Mobile App)
#define SERVICE_UUID        "91bad492-b950-4226-aa2b-4ede9fa42f59"
#define CHARACTERISTIC_UUID "cba1d466-344c-4be3-ab2d-ad559a9412f5"

// Hardware Pins
const int ecgPin = 34;
const int loPlusPin = 25;
const int loMinusPin = 33;
const int ledPin = 2;   // Built-in LED for status

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Sampling at 200Hz (5ms)
unsigned long previousMillis = 0;
const long sampleInterval = 5;

// BLE batching: send 4 samples together at ~50Hz (20ms)
// This keeps 200Hz data but sends fewer BLE packets
String batchBuffer = "";
int batchCount = 0;
const int BATCH_SIZE = 4;  // 4 samples per BLE notification

// LED blink
unsigned long lastLedToggle = 0;
bool ledState = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      digitalWrite(ledPin, HIGH);  // LED ON = connected
      Serial.println(">> App Connected!");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      digitalWrite(ledPin, LOW);   // LED OFF = disconnected
      Serial.println(">> App Disconnected.");
    }
};

void setup() {
  Serial.begin(115200);

  // Pin Configuration
  pinMode(ecgPin, INPUT);
  pinMode(loPlusPin, INPUT);
  pinMode(loMinusPin, INPUT);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  Serial.println("============================");
  Serial.println("  VitalTrace ECG v2.0");
  Serial.println("============================");

  // Initialize BLE
  BLEDevice::init("VitalTrace_ECG");
  
  // Set TX power for better range
  esp_ble_tx_power_set(ESP_BLE_PWR_TYPE_DEFAULT, ESP_PWR_LVL_P9);
  esp_ble_tx_power_set(ESP_BLE_PWR_TYPE_ADV, ESP_PWR_LVL_P9);

  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );

  // Add Descriptor (Required for Notify to work)
  pCharacteristic->addDescriptor(new BLE2902());

  // Start Service
  pService->start();

  // Start Advertising with PROPER parameters
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);           // FIXED: was false
  pAdvertising->setMinPreferred(0x06);           // FIXED: was 0x0 (helps iPhone/Android connect)
  pAdvertising->setMaxPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE Advertising started...");
  Serial.println("Waiting for VitalTrace App...");
  Serial.println("----------------------------");
}

void loop() {
    unsigned long currentMillis = millis();

    // ===== Sample ECG at 200Hz (every 5ms) =====
    if (currentMillis - previousMillis >= sampleInterval) {
        previousMillis = currentMillis;

        // Check leads-off detection
        bool leadsOff = (digitalRead(loPlusPin) == 1) || (digitalRead(loMinusPin) == 1);

        int ecgValue;

        if (leadsOff) {
            ecgValue = -1;  // Signal leads off
            Serial.println("Leads off!");
        } else {
            // Read raw ECG analog value (0-4095)
            ecgValue = analogRead(ecgPin);
            Serial.println(ecgValue);
        }

        // ===== BLE: Batch 4 samples into 1 notification =====
        // Format: "val1\nval2\nval3\nval4\n"
        if (deviceConnected) {
            if (batchCount > 0) {
                batchBuffer += "\n";
            }
            batchBuffer += String(ecgValue);
            batchCount++;

            // Send batch when full (every ~20ms = 50 notifications/sec)
            if (batchCount >= BATCH_SIZE) {
                batchBuffer += "\n";
                pCharacteristic->setValue(batchBuffer.c_str());
                pCharacteristic->notify();
                
                batchBuffer = "";
                batchCount = 0;
                
                // Small delay to let BLE stack breathe
                delay(1);
            }
        }
    }

    // ===== Handle BLE disconnection =====
    if (!deviceConnected && oldDeviceConnected) {
        delay(500);  // Give BLE stack time to settle
        pServer->startAdvertising();  // Restart advertising
        Serial.println("Restarting advertising...");
        oldDeviceConnected = deviceConnected;
        
        // Reset batch
        batchBuffer = "";
        batchCount = 0;
    }

    // ===== Handle new BLE connection =====
    if (deviceConnected && !oldDeviceConnected) {
        oldDeviceConnected = deviceConnected;
        // Reset batch on new connection
        batchBuffer = "";
        batchCount = 0;
    }

    // ===== LED blink when waiting (not connected) =====
    if (!deviceConnected) {
        if (currentMillis - lastLedToggle > 500) {
            lastLedToggle = currentMillis;
            ledState = !ledState;
            digitalWrite(ledPin, ledState);
        }
    }
}
