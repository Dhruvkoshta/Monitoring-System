# IoT Hazard Monitoring System

## Overview

This project is a comprehensive IoT-based Hazard Monitoring System designed to detect and alert users about environmental hazards such as **Fire**, **Floods**, and **Earthquakes**. It features a robust architecture combining embedded systems (ESP32 with LoRa) for data collection and transmission, a Node.js backend for data processing and storage, and a React-based frontend for real-time monitoring and visualization.

## Key Features

- **Real-time Hazard Detection:** Monitors Fire (flame sensor), Flood (soil moisture sensor), and Earthquake (MPU6050 accelerometer) conditions.
- **LoRa Communication:** Utilizes Long Range (LoRa) technology for reliable wireless communication between sensor nodes (Transmitters) and the central Gateway (Receiver).
- **Centralized Monitoring Dashboard:** A modern, responsive React frontend displays real-time status of all monitored rooms/nodes.
- **Visual Alerts:** Immediate visual feedback on the dashboard for Critical, Warning, and Normal states.
- **Data Logging:** Historical sensor data is logged to a SQLite database via the backend server.
- **Serial Integration:** The frontend supports direct Web Serial connection to the Gateway for local monitoring without internet dependence.

## System Architecture

### 1. Embedded System (ESP32 Firmware)

The hardware layer consists of ESP32 microcontrollers programmed in C++ (Arduino framework).

- **Transmitter (Sensor Node):**

  - **Sensors:**
    - **Fire:** IR Flame Sensor (Digital input).
    - **Flood:** Soil Moisture Sensor (Analog input, mapped to percentage).
    - **Earthquake:** MPU6050 Accelerometer/Gyroscope (I2C). Detects intensity based on G-force delta.
  - **Logic:** Reads sensors continuously. If a hazard threshold is breached (e.g., moisture > 40%, quake intensity > 4.0), it triggers a "PANIC" state, activates a local LED, and transmits an alert packet via LoRa.
  - **Heartbeat:** Sends periodic "SYSTEM_OK" messages with sensor data to indicate connectivity when no hazards are present.

- **Receiver (Gateway):**
  - **Function:** Listens for LoRa packets from Transmitters.
  - **Processing:** Parses incoming strings (format: `ID|MESSAGE`).
  - **Alerting:** Activates a local buzzer for audio alarms upon receiving a "PANIC" message.
  - **Data Forwarding:** Formats the received data into a JSON string and sends it over Serial (USB) to the connected computer/server.

### 2. Backend (Node.js Server)

A dedicated server handles data persistence and API endpoints.

- **Tech Stack:** Node.js, Express, Socket.io, SQLite (via Drizzle ORM).
- **API:** RESTful endpoints for receiving sensor readings (`/api/readings`), fetching logs, managing alerts, and retrieving room status.
- **Real-time Updates:** Uses Socket.io to push immediate sensor updates to connected frontend clients.
- **Database:** Stores sensor logs, alert events, and room configurations in a SQLite database.
- **Notifications:** Integrated with `ntfy.sh` for sending push notifications to mobile devices for critical events.

### 3. Frontend (React Dashboard)

User interface for monitoring and management.

- **Tech Stack:** React, Material-UI (MUI), Vite, Recharts/ApexCharts.
- **Dashboard:** Displays a grid of "Room Cards" showing the status of each sensor node.
- **Web Serial:** Features a "Connect to Device" button that allows the browser to read JSON data directly from the ESP32 Gateway via USB (Web Serial API), bypassing the backend for local-only setups.
- **Visualizations:**
  - **Status Indicators:** Color-coded icons for Fire, Flood, and Quake.
  - **System Health:** Summary cards for overall system status (Critical/Normal) and active node counts.
