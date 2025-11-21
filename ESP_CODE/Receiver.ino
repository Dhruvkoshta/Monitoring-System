/*
  ESP32 Hazard Smart Receiver (Gateway)

  Updates:
  - Connects to WiFi
  - Forwards LoRa packets to Node.js Server via HTTP POST
  - Parses "ID|MESSAGE" format

  Wiring: SAME AS BEFORE (DIO0 = GPIO 4)
*/

#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <HTTPClient.h>

// --- CONFIGURATION ---
const char *ssid = "RH-5.8G-8ED440";
const char *password = "44953B8ED440";
const char *serverUrl = "http://192.168.1.14:5000/api/readings"; // Replace with PC IP

#define SS_PIN 5
#define RST_PIN 14
#define DIO0_PIN 4

const int buzzerPin = 25;

void setup()
{
    Serial.begin(115200);
    while (!Serial)
        ;

    pinMode(buzzerPin, OUTPUT);

    // Startup Blink
    digitalWrite(buzzerPin, HIGH);
    delay(100);
    digitalWrite(buzzerPin, LOW);

    // --- WiFi Setup ---
    Serial.print("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println(" Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    Serial.println("Hazard Receiver Active & Filtering Noise...");

    LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);

    if (!LoRa.begin(433E6))
    {
        Serial.println("LoRa init failed!");
        while (1)
            ;
    }
}

void sendToServer(String roomId, bool fire, bool flood, bool quake, int floodLevel, float quakeIntensity, int rssi)
{
    if (WiFi.status() == WL_CONNECTED)
    {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        String json = "{";
        json += "\"id\":\"" + roomId + "\",";
        json += "\"fire\":" + String(fire ? "true" : "false") + ",";
        json += "\"flood\":" + String(flood ? "true" : "false") + ",";
        json += "\"quake\":" + String(quake ? "true" : "false") + ",";
        json += "\"floodLevel\":" + String(floodLevel) + ",";
        json += "\"quakeIntensity\":" + String(quakeIntensity) + ",";
        json += "\"rssi\":" + String(rssi);
        json += "}";

        int httpResponseCode = http.POST(json);

        if (httpResponseCode > 0)
        {
            String response = http.getString();
            Serial.println("Server Response: " + response);
        }
        else
        {
            Serial.print("Error on sending POST: ");
            Serial.println(httpResponseCode);
        }
        http.end();
    }
    else
    {
        Serial.println("WiFi Disconnected");
    }
}

void loop()
{
    int packetSize = LoRa.parsePacket();

    if (packetSize)
    {
        String incoming = "";
        while (LoRa.available())
        {
            incoming += (char)LoRa.read();
        }

        // Format: ID|MESSAGE
        int splitIndex = incoming.indexOf('|');
        if (splitIndex > 0)
        {
            String roomId = incoming.substring(0, splitIndex);
            String message = incoming.substring(splitIndex + 1);
            int rssi = LoRa.packetRssi();

            Serial.print("RX [Room " + roomId + " RSSI " + String(rssi) + "]: " + message);

            bool fire = false;
            bool flood = false;
            bool quake = false;
            int floodLevel = 0;
            float quakeIntensity = 0.0;

            // Parse Message
            if (message.startsWith("PANIC"))
            {
                Serial.println(" !!! HAZARD ALERT !!!");

                // Alarm Pattern
                digitalWrite(buzzerPin, HIGH);
                delay(100);
                digitalWrite(buzzerPin, LOW);

                if (message.indexOf("FIRE") >= 0)
                    fire = true;

                int floodIdx = message.indexOf("FLOOD:");
                if (floodIdx >= 0)
                {
                    flood = true;
                    int endIdx = message.indexOf(",", floodIdx);
                    if (endIdx == -1)
                        endIdx = message.length();
                    floodLevel = message.substring(floodIdx + 6, endIdx).toInt();
                }

                int quakeIdx = message.indexOf("QUAKE:");
                if (quakeIdx >= 0)
                {
                    quake = true;
                    int endIdx = message.indexOf(",", quakeIdx);
                    if (endIdx == -1)
                        endIdx = message.length();
                    quakeIntensity = message.substring(quakeIdx + 6, endIdx).toFloat();
                }

                sendToServer(roomId, fire, flood, quake, floodLevel, quakeIntensity, rssi);
            }
            else if (message.startsWith("ALARM_CLEAR"))
            {
                Serial.println(" Alarm Cleared.");
                digitalWrite(buzzerPin, LOW);
                // Send clear status (all false)
                sendToServer(roomId, false, false, false, 0, 0.0, rssi);
            }
            else if (message.startsWith("SYSTEM_OK"))
            {
                // Heartbeat
                digitalWrite(buzzerPin, HIGH);
                delay(50);
                digitalWrite(buzzerPin, LOW);

                // Parse extra data if available (e.g. SYSTEM_OK:RSSI:-50,FLOOD:10)
                int floodIdx = message.indexOf("FLOOD:");
                if (floodIdx >= 0)
                {
                    int endIdx = message.indexOf(",", floodIdx);
                    if (endIdx == -1)
                        endIdx = message.length();
                    floodLevel = message.substring(floodIdx + 6, endIdx).toInt();
                }

                sendToServer(roomId, false, false, false, floodLevel, 0.0, rssi);
            }
        }
    }
}
