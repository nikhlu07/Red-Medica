# 🚀 Deploy with Hardhat - Quick Steps

## ✅ Step 1: Create .env file (IMPORTANT!)

Create a new file: `contracts/solidity/.env`

Add this content:
```
PRIVATE_KEY=your_metamask_private_key_here
```

### **How to get your MetaMask Private Key:**
1. Open MetaMask
2. Click the 3 dots → Account Details
3. Click "Show Private Key"
4. Enter your password
5. Copy the private key
6. Paste it in the `.env` file

**NEVER share or commit this file!**

---

## ✅ Step 2: Test Compilation

```bash
cd contracts/solidity
npx hardhat compile
```

Should see: ✅ Compiled successfully

---

## ✅ Step 3: Run Tests (Optional)

```bash
npx hardhat test
```

Should pass all 40+ tests ✅

---

## ✅ Step 4: Deploy to Passet Hub

```bash
npx hardhat run scripts/deploy.js --network passetHub
```

**Expected output:**
```
🚀 Deploying MedicalSupplyChain contract...
📝 Deploying with account: 0x...
💰 Account balance: X PAS
⏳ Deploying contract...
✅ Contract deployed successfully!
📍 Contract address: 0x...
```

**SAVE THE CONTRACT ADDRESS!**

---

## ✅ Step 5: Test Contract

In Remix or via Hardhat console:
```bash
npx hardhat console --network passetHub
```

Then:
```javascript
const contract = await ethers.getContractAt("MedicalSupplyChain", "YOUR_CONTRACT_ADDRESS");
await contract.getNextProductId(); // Should return 1
```

---

## 🎯 Quick Commands Reference

```bash
# Install dependencies
npm install

# Compile
npx hardhat compile

# Test
npx hardhat test

# Deploy to Passet Hub
npx hardhat run scripts/deploy.js --network passetHub

# Deploy to Sepolia (if needed)
npx hardhat run scripts/deploy.js --network sepolia

# Clean
npx hardhat clean
```

---

## 🐛 Troubleshooting

### "Missing PRIVATE_KEY"
- Create `.env` file in `contracts/solidity/` folder
- Add your MetaMask private key

### "Insufficient funds"
- Make sure you have PAS tokens
- Check you're on Passet Hub network in MetaMask

### "Network error"
- Check internet connection
- Try again after a minute

---

## ✅ After Deployment

1. **Save contract address** somewhere safe
2. **Update frontend .env:**
   ```
   VITE_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
   VITE_NETWORK_RPC=https://testnet-passet-hub-eth-rpc.polkadot.io
   VITE_CHAIN_ID=420420422
   ```
3. **Test in Remix** or **Hardhat console**
4. **Register a product** to verify it works

---

**You're ready to deploy!** 🚀
