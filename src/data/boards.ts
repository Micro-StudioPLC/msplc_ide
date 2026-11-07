import { TargetBoard } from '../types/embedded';

export const TARGET_BOARDS: TargetBoard[] = [
  {
    id: 'mspv1',
    name: 'MSPv1',
    mcu: 'MSPv1 Intermediary Core',
    architecture: 'Intermediary Binary Language (MSPv1-IL)',
    clockSpeed: '20 MHz Virtual Core',
    flashSize: 128 * 1024, // 128 KB Bytecode ROM
    ramSize: 16 * 1024,    // 16 KB SRAM
    eepromSize: 4096,
    voltage: '24V DC / 5V Logic',
    defaultBaud: 115200,
    digitalPins: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    analogPins: ['A0', 'A1', 'A2', 'A3'],
    pwmPins: [5, 6, 9, 10],
    hasRelays: true,
    relayCount: 4,
    description: 'MSPv1 Intermediary Language Specification target for PLC automation, gateway routing, and virtual bytecode execution.'
  }
];
