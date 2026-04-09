# Fixed Power Calculation Note

The calculatePowerConsumption function has been fixed to properly account for all components with realistic power values:

- CPU: TDP from database (used extractTDP)
- GPU: TDP from database (used extractTDP)  
- RAM: 5W per stick (using extractRAMCapacity and extractMemorySlots)
- Storage: 10W per SSD, 3W per HDD (using extractStorageType)
- Cooling/Fans: 3W per fan (using extractMaxCoolerTDP as proxy, or 3W default)
- Base motherboard/system: 50W

Applied to: src/frontend/src/utils/compatibilityUtils.ts