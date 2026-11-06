import { TargetBoard } from '../types/embedded';

export const TARGET_BOARDS: TargetBoard[] = [
  {
    id: 'industrial_plc',
    name: 'Industrial Micro-PLC Gateway',
    mcu: 'ATmega2560 / Rugged Core',
    architecture: 'AVR 8-bit (24V Industrial)',
    clockSpeed: '16 MHz',
    flashSize: 256 * 1024, // 256 KB
    ramSize: 8 * 1024,      // 8 KB
    eepromSize: 4096,
    voltage: '24V DC / 5V Logic',
    defaultBaud: 115200,
    digitalPins: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    analogPins: ['A0', 'A1', 'A2', 'A3'],
    pwmPins: [5, 6, 9, 10],
    hasRelays: true,
    relayCount: 4,
    description: 'DIN-rail automation controller with 4x 10A Relays, optoisolated 24V inputs, and Modbus/Serial gateway.'
  },
  {
    id: 'arduino_uno',
    name: 'Arduino Uno R3 / Classic MCU',
    mcu: 'ATmega328P',
    architecture: 'AVR RISC 8-bit',
    clockSpeed: '16 MHz',
    flashSize: 32 * 1024,  // 32 KB
    ramSize: 2 * 1024,     // 2 KB
    eepromSize: 1024,
    voltage: '5V DC',
    defaultBaud: 115200,
    digitalPins: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    analogPins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
    pwmPins: [3, 5, 6, 9, 10, 11],
    hasRelays: false,
    relayCount: 0,
    description: 'Standard education & rapid prototyping platform for sensor nodes and simple automation.'
  },
  {
    id: 'esp32_gateway',
    name: 'ESP32 IoT Automation Hub',
    mcu: 'ESP-WROOM-32 (Xtensa LX6)',
    architecture: 'Xtensa Dual-Core 32-bit',
    clockSpeed: '240 MHz',
    flashSize: 4 * 1024 * 1024, // 4 MB
    ramSize: 520 * 1024,        // 520 KB
    eepromSize: 4096,
    voltage: '3.3V DC',
    defaultBaud: 115200,
    digitalPins: [2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23],
    analogPins: ['A0', 'A1', 'A2', 'A3'],
    pwmPins: [2, 4, 12, 13, 14, 15],
    hasRelays: true,
    relayCount: 2,
    description: 'High-speed dual-core gateway for MQTT, JSON REST telemetry, home automation, and sensor mesh.'
  },
  {
    id: 'rp2040_pico',
    name: 'Raspberry Pi Pico RP2040',
    mcu: 'RP2040 Dual ARM Cortex-M0+',
    architecture: 'ARMv6-M 32-bit',
    clockSpeed: '133 MHz',
    flashSize: 2 * 1024 * 1024, // 2 MB
    ramSize: 264 * 1024,        // 264 KB
    eepromSize: 0,
    voltage: '3.3V DC',
    defaultBaud: 115200,
    digitalPins: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 25],
    analogPins: ['A0', 'A1', 'A2'],
    pwmPins: [2, 3, 4, 5, 6, 7, 8, 9],
    hasRelays: false,
    relayCount: 0,
    description: 'Dual-core ARM microcontroller with PIO state machines and low latency interrupt handling.'
  }
];
