/*
  ESP32 All-Hazard LoRa Transmitter (PRODUCTION READY)

  STATUS:
  - MPU6050: ACTIVE (Raw Driver)
  - Flame Sensor: ACTIVE
  - Soil Sensor:  ACTIVE

  Pin Connections:
  - MPU6050 SCL -> GPIO 22
  - MPU6050 SDA -> GPIO 21
  - Flame DO    -> GPIO 25
  - Moisture A0 -> GPIO 36 (VP)
  - Panic LED   -> GPIO 26
  - On-Board LED-> GPIO 2

  - LoRa SCK    -> GPIO 18
  - LoRa MISO   -> GPIO 19
  - LoRa MOSI   -> GPIO 23
  - LoRa CS     -> GPIO 5
  - LoRa RST    -> GPIO 14
  - LoRa DIO0   -> GPIO 4
*/

#include <Wire.h>
#include <SPI.h>
#include <LoRa.h>

// --- CONFIGURATION ---
#define ROOM_ID "1" // Unique ID for this Room (Matches Frontend ID)

// --- Pin Definitions ---
const int flameSensorPin = 25;
const int moistureSensorPin = 36;
const int panicLedPin = 26;
const int onboardLedPin = 2;

// --- LoRa Pins ---
#define SS_PIN 5
#define RST_PIN 14
#define DIO0_PIN 4

// --- Earthquake Settings ---
const int MPU_ADDR = 0x68;
const float ALARM_INTENSITY_THRESHOLD = 4.0;
float baseline_accel_magnitude = 0;

// --- State Management ---
unsigned long lastHeartbeat = 0;
const long heartbeatInterval = 60000;
bool isAlarmActive = false;
bool wasAlarmActive = false;

// --- Helper: Send LoRa ---
void sendLoRaMessage(String message)
{
    digitalWrite(onboardLedPin, HIGH);

    // Prefix message with Room ID
    String fullMessage = String(ROOM_ID) + "|" + message;

    Serial.print("TX >> ");
    Serial.println(fullMessage);

    LoRa.beginPacket();
    LoRa.print(fullMessage);
    LoRa.endPacket();

    digitalWrite(onboardLedPin, LOW);
}

// --- Helper: Raw MPU Write ---
void mpuWrite(byte reg, byte data)
{
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(reg);
    Wire.write(data);
    Wire.endTransmission();
}

// --- Helper: Raw MPU Read Acceleration ---
float readMpuMagnitude()
{
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x3B);
    Wire.endTransmission(false);
    Wire.requestFrom(MPU_ADDR, 6, true);

    if (Wire.available() < 6)
        return 0;

    int16_t Ax = (Wire.read() << 8 | Wire.read());
    int16_t Ay = (Wire.read() << 8 | Wire.read());
    int16_t Az = (Wire.read() << 8 | Wire.read());

    // Convert raw data to G-force
    float x = Ax / 16384.0;
    float y = Ay / 16384.0;
    float z = Az / 16384.0;

    return sqrt(pow(x, 2) + pow(y, 2) + pow(z, 2));
}

float mapFloat(float x, float in_min, float in_max, float out_min, float out_max)
{
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

float getIntensity(float delta)
{
    if (delta <= 0.1)
        return mapFloat(delta, 0.0, 0.1, 1.0, 2.0);
    if (delta <= 1.0)
        return mapFloat(delta, 0.1, 1.0, 2.0, 4.0);
    if (delta <= 3.0)
        return mapFloat(delta, 1.0, 3.0, 4.0, 6.0);
    if (delta <= 6.0)
        return mapFloat(delta, 3.0, 6.0, 6.0, 8.0);
    return mapFloat(delta, 6.0, 10.0, 8.0, 10.0);
}

void setup()
{
    Serial.begin(115200);
    while (!Serial)
        ;
    Serial.println("--- Hazard Transmitter (PRODUCTION) ---");
    Serial.print("Room ID: ");
    Serial.println(ROOM_ID);

    pinMode(panicLedPin, OUTPUT);
    pinMode(flameSensorPin, INPUT);
    pinMode(onboardLedPin, OUTPUT);

    // --- RAW MPU6050 SETUP ---
    Serial.println("Initializing I2C...");
    Wire.begin(21, 22);
    Wire.setClock(100000);
    delay(200);

    Serial.println("Waking MPU...");
    mpuWrite(0x6B, 0x00); // PWR_MGMT_1 -> 0 (Wake Up)
    delay(100);
    mpuWrite(0x1C, 0x00); // ACCEL_CONFIG -> 0 (+/- 2g)

    Serial.println("MPU6050 Initialized. Calibrating...");

    float sum = 0;
    for (int i = 0; i < 100; i++)
    {
        sum += readMpuMagnitude();
        delay(10);
    }
    baseline_accel_magnitude = sum / 100.0;

    if (baseline_accel_magnitude < 0.1)
    {
        Serial.println(" ! WARNING: MPU readings are 0. Check Wiring !");
    }
    else
    {
        Serial.print("Baseline Gravity: ");
        Serial.println(baseline_accel_magnitude);
    }

    // Init LoRa
    LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);
    if (!LoRa.begin(433E6))
    {
        Serial.println("Error: LoRa init failed.");
        while (1)
            ;
    }
    LoRa.setTxPower(20);
    Serial.println("LoRa OK. System Armed.");

    lastHeartbeat = millis();
}

void loop()
{
    // --- 1. Read All Sensors ---

    // A. Fire Sensor (IR Flame Sensor)
    // Digital Read: Returns LOW when fire is detected (Inverse logic is common)
    bool isFire = (digitalRead(flameSensorPin) == LOW);

    // B. Soil Moisture Sensor
    // Analog Read: 4095 is dry air, ~1500 is water.
    int moistVal = analogRead(moistureSensorPin);
    int moisturePercent = map(moistVal, 4095, 1500, 0, 100);
    moisturePercent = constrain(moisturePercent, 0, 100);
    bool isFlood = (moisturePercent > 40); // Alarm if > 40% wet

    // C. Earthquake Sensor
    float currentMag = readMpuMagnitude();
    float delta = abs(currentMag - baseline_accel_magnitude);
    float intensity = getIntensity(delta);
    bool isQuake = (intensity > ALARM_INTENSITY_THRESHOLD);

    // --- 2. Logic ---
    wasAlarmActive = isAlarmActive;
    isAlarmActive = isFire || isFlood || isQuake;

    // --- 3. Transmission Logic ---
    if (isAlarmActive)
    {
        digitalWrite(panicLedPin, HIGH); // Turn ON Alert LED

        if (!wasAlarmActive)
        {
            // First time detection: Send Instant Alert
            String msg = "PANIC:";
            if (isFire)
                msg += "FIRE,";
            if (isFlood)
                msg += "FLOOD:" + String(moisturePercent) + ",";
            if (isQuake)
                msg += "QUAKE:" + String(intensity, 1) + ",";

            // Remove trailing comma
            if (msg.endsWith(","))
                msg.remove(msg.length() - 1);

            sendLoRaMessage(msg);
            lastHeartbeat = millis();
        }
        // Blink effect for Panic LED
        delay(200);
        digitalWrite(panicLedPin, LOW);
    }
    else
    {
        digitalWrite(panicLedPin, LOW);

        // If alarm just stopped, send "All Clear"
        if (wasAlarmActive)
        {
            sendLoRaMessage("ALARM_CLEAR");
            lastHeartbeat = millis();
        }
    }

    // --- 4. Heartbeat ---
    if (millis() - lastHeartbeat > heartbeatInterval && !isAlarmActive)
    {
        // Send sensor data in heartbeat too
        String msg = "SYSTEM_OK:RSSI:" + String(LoRa.packetRssi()) + ",FLOOD:" + String(moisturePercent);
        sendLoRaMessage(msg);
        lastHeartbeat = millis();
    }

    delay(250);
}
