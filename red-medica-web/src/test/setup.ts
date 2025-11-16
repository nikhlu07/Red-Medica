import '@testing-library/jest-dom'

// Mock Polkadot extension for tests
Object.defineProperty(window, 'injectedWeb3', {
  value: {},
  writable: true,
})

// Mock environment variables
process.env.VITE_POLKADOT_WS = 'ws://localhost:9944'
process.env.VITE_CONTRACT_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'