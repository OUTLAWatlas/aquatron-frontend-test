// src/utils/bluetooth.js
// Simple Web Bluetooth utility for STM32 communication

export async function connectBluetooth() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] }], // Example UUID, replace with STM32's
      optionalServices: ['battery_service']
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
    return { device, server, service, characteristic };
  } catch (err) {
    throw err;
  }
}

export async function sendBluetoothData(characteristic, data) {
  if (!characteristic) throw new Error('No Bluetooth characteristic');
  await characteristic.writeValue(data);
}

export async function readBluetoothData(characteristic) {
  if (!characteristic) throw new Error('No Bluetooth characteristic');
  const value = await characteristic.readValue();
  return value;
}
