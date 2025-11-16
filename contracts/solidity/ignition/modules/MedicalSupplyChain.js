const { buildModule } = require("@nomicfoundation/ignition-core");

module.exports = buildModule("MedicalSupplyChainModule", (m) => {
  // Deploy the MedicalSupplyChain contract
  const medicalSupplyChain = m.contract("MedicalSupplyChain");

  return { medicalSupplyChain };
});
