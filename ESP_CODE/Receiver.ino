/*
  ESP32 Hazard Smart Receiver (Gateway - Serial Version)
  
  Updates: 
  - REMOVED WiFi & HTTP
  - Forwards LoRa packets to Computer via USB Serial (JSON format)
  - Parses "ID|MESSAGE" format
  
  Wiring: SAME AS BEFORE (DIO0 = GPIO 4)
*/

#include <SPI.h>
#include <LoRa.h>

// --- CONFIGURATION ---
#define SS_PIN    5
#define RST_PIN   14
#define DIO0_PIN  4   

const int buzzerPin = 25; 

void setup() {
  Serial.begin(115200);
  while (!Serial);
  
  pinMode(buzzerPin, OUTPUT);
  
  // Startup Blink
  digitalWrite(buzzerPin, HIGH); delay(100); digitalWrite(buzzerPin, LOW);

  Serial.println("Hazard Receiver Active (Serial Mode)...");
  
  LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);
  
  if (!LoRa.begin(433E6)) { 
    Serial.println("LoRa init failed!");
    while (1);
  }
}

void sendToSerial(String roomId, bool fire, bool flood, bool quake, int floodLevel, float quakeIntensity, int rssi) {
  // Create JSON string
  String json = "{";
  json += "\"id\":\"" + roomId + "\",";
  json += "\"fire\":" + String(fire ? "true" : "false") + ",";
  json += "\"flood\":" + String(flood ? "true" : "false") + ",";
  json += "\"quake\":" + String(quake ? "true" : "false") + ",";
  json += "\"floodLevel\":" + String(floodLevel) + ",";
  json += "\"quakeIntensity\":" + String(quakeIntensity) + ",";
  json += "\"rssi\":" + String(rssi);
  json += "}";
  
  // Send to Serial (USB)
  Serial.println(json);
}

void loop() {
  int packetSize = LoRa.parsePacket();
  
  if (packetSize) {
    String incoming = "";
    while (LoRa.available()) {
      incoming += (char)LoRa.read();
    }

    // Format: ID|MESSAGE
    int splitIndex = incoming.indexOf('|');
    if (splitIndex > 0) {
      String roomId = incoming.substring(0, splitIndex);
      String message = incoming.substring(splitIndex + 1);
      int rssi = LoRa.packetRssi();

      // Debug print (commented out to not mess up JSON parsing if needed)
      // Serial.print("DEBUG: RX [Room " + roomId + "]: " + message);

      bool fire = false;
      bool flood = false;
      bool quake = false;
      int floodLevel = 0;
      float quakeIntensity = 0.0;

      // Parse Message
      if (message.startsWith("PANIC")) {
        // Alarm Pattern
        digitalWrite(buzzerPin, HIGH); delay(100); digitalWrite(buzzerPin, LOW);

        if (message.indexOf("FIRE") >= 0) fire = true;
        
        int floodIdx = message.indexOf("FLOOD:");
        if (floodIdx >= 0) {
          flood = true;
          int endIdx = message.indexOf(",", floodIdx);
          if (endIdx == -1) endIdx = message.length();
          floodLevel = message.substring(floodIdx + 6, endIdx).toInt();
        }

        int quakeIdx = message.indexOf("QUAKE:");
        if (quakeIdx >= 0) {
          quake = true;
          int endIdx = message.indexOf(",", quakeIdx);
          if (endIdx == -1) endIdx = message.length();
          quakeIntensity = message.substring(quakeIdx + 6, endIdx).toFloat();
        }
        
        sendToSerial(roomId, fire, flood, quake, floodLevel, quakeIntensity, rssi);
      } 
      else if (message.startsWith("ALARM_CLEAR")) {
        digitalWrite(buzzerPin, LOW);
        // Send clear status (all false)
        sendToSerial(roomId, false, false, false, 0, 0.0, rssi);
      }
      else if (message.startsWith("SYSTEM_OK")) {
        // Heartbeat
        digitalWrite(buzzerPin, HIGH); delay(50); digitalWrite(buzzerPin, LOW);
        
        // Parse extra data if available
        int floodIdx = message.indexOf("FLOOD:");
        if (floodIdx >= 0) {
           int endIdx = message.indexOf(",", floodIdx);
           if (endIdx == -1) endIdx = message.length();
           floodLevel = message.substring(floodIdx + 6, endIdx).toInt();
        }
        
        sendToSerial(roomId, false, false, false, floodLevel, 0.0, rssi);
      }
    }
  }
}
