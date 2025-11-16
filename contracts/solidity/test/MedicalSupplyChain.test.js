const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalSupplyChain", function () {
  let medicalSupplyChain;
  let owner;
  let manufacturer;
  let distributor;
  let pharmacy;

  beforeEach(async function () {
    [owner, manufacturer, distributor, pharmacy] = await ethers.getSigners();

    const MedicalSupplyChain = await ethers.getContractFactory("MedicalSupplyChain");
    medicalSupplyChain = await MedicalSupplyChain.deploy();
    await medicalSupplyChain.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await medicalSupplyChain.owner()).to.equal(owner.address);
    });

    it("Should authorize owner as manufacturer", async function () {
      expect(await medicalSupplyChain.authorizedManufacturers(owner.address)).to.be.true;
    });

    it("Should initialize nextProductId to 1", async function () {
      expect(await medicalSupplyChain.nextProductId()).to.equal(1);
    });
  });

  describe("Manufacturer Authorization", function () {
    it("Should allow owner to authorize manufacturer", async function () {
      await medicalSupplyChain.authorizeManufacturer(manufacturer.address, true);
      expect(await medicalSupplyChain.authorizedManufacturers(manufacturer.address)).to.be.true;
    });

    it("Should allow owner to revoke manufacturer", async function () {
      await medicalSupplyChain.authorizeManufacturer(manufacturer.address, true);
      await medicalSupplyChain.authorizeManufacturer(manufacturer.address, false);
      expect(await medicalSupplyChain.authorizedManufacturers(manufacturer.address)).to.be.false;
    });

    it("Should emit ManufacturerAuthorized event", async function () {
      await expect(medicalSupplyChain.authorizeManufacturer(manufacturer.address, true))
        .to.emit(medicalSupplyChain, "ManufacturerAuthorized")
        .withArgs(manufacturer.address, true);
    });

    it("Should revert if non-owner tries to authorize", async function () {
      await expect(
        medicalSupplyChain.connect(manufacturer).authorizeManufacturer(distributor.address, true)
      ).to.be.revertedWithCustomError(medicalSupplyChain, "OnlyOwner");
    });
  });

  describe("Product Registration", function () {
    beforeEach(async function () {
      await medicalSupplyChain.authorizeManufacturer(manufacturer.address, true);
    });

    it("Should register product successfully", async function () {
      const tx = await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Amoxicillin 500mg",
        "BATCH-001",
        "PharmaCorp Ltd",
        1000,
        1704067200,
        1767225600,
        "Antibiotic"
      );

      await expect(tx)
        .to.emit(medicalSupplyChain, "ProductRegistered")
        .withArgs(1, manufacturer.address, "Amoxicillin 500mg", "BATCH-001");

      const product = await medicalSupplyChain.verifyProduct(1);
      expect(product.id).to.equal(1);
      expect(product.name).to.equal("Amoxicillin 500mg");
      expect(product.batchNumber).to.equal("BATCH-001");
      expect(product.manufacturer).to.equal(manufacturer.address);
      expect(product.currentHolder).to.equal(manufacturer.address);
      expect(product.isAuthentic).to.be.true;
    });

    it("Should increment nextProductId", async function () {
      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Medicine A",
        "BATCH-001",
        "Pharma A",
        1000,
        1704067200,
        1767225600,
        "Antibiotic"
      );

      expect(await medicalSupplyChain.nextProductId()).to.equal(2);
    });

    it("Should revert if unauthorized manufacturer tries to register", async function () {
      await expect(
        medicalSupplyChain.connect(distributor).registerProduct(
          "Medicine",
          "BATCH-001",
          "Pharma",
          1000,
          1704067200,
          1767225600,
          "Antibiotic"
        )
      ).to.be.revertedWithCustomError(medicalSupplyChain, "NotAuthorizedManufacturer");
    });

    it("Should register multiple products", async function () {
      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Medicine A",
        "BATCH-001",
        "Pharma A",
        1000,
        1704067200,
        1767225600,
        "Antibiotic"
      );

      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Medicine B",
        "BATCH-002",
        "Pharma B",
        2000,
        1704067200,
        1767225600,
        "Painkiller"
      );

      expect(await medicalSupplyChain.nextProductId()).to.equal(3);
      
      const product1 = await medicalSupplyChain.verifyProduct(1);
      const product2 = await medicalSupplyChain.verifyProduct(2);
      
      expect(product1.name).to.equal("Medicine A");
      expect(product2.name).to.equal("Medicine B");
    });
  });

  describe("Custody Transfer", function () {
    beforeEach(async function () {
      await medicalSupplyChain.authorizeManufacturer(manufacturer.address, true);
      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Test Medicine",
        "BATCH-001",
        "Test Pharma",
        1000,
        1704067200,
        1767225600,
        "Antibiotic"
      );
    });

    it("Should transfer custody successfully", async function () {
      await expect(
        medicalSupplyChain.connect(manufacturer).transferCustody(
          1,
          distributor.address,
          "Mumbai Warehouse"
        )
      )
        .to.emit(medicalSupplyChain, "CustodyTransferred")
        .withArgs(1, manufacturer.address, distributor.address, "Mumbai Warehouse");

      const product = await medicalSupplyChain.verifyProduct(1);
      expect(product.currentHolder).to.equal(distributor.address);
    });

    it("Should record transfer in history", async function () {
      await medicalSupplyChain.connect(manufacturer).transferCustody(
        1,
        distributor.address,
        "Mumbai Warehouse"
      );

      const history = await medicalSupplyChain.getTransferHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0].from).to.equal(manufacturer.address);
      expect(history[0].to).to.equal(distributor.address);
      expect(history[0].location).to.equal("Mumbai Warehouse");
      expect(history[0].verified).to.be.true;
    });

    it("Should allow chain of transfers", async function () {
      await medicalSupplyChain.connect(manufacturer).transferCustody(
        1,
        distributor.address,
        "Mumbai Warehouse"
      );

      await medicalSupplyChain.connect(distributor).transferCustody(
        1,
        pharmacy.address,
        "Delhi Pharmacy"
      );

      const product = await medicalSupplyChain.verifyProduct(1);
      expect(product.currentHolder).to.equal(pharmacy.address);

      const history = await medicalSupplyChain.getTransferHistory(1);
      expect(history.length).to.equal(2);
    });

    it("Should revert if non-holder tries to transfer", async function () {
      await expect(
        medicalSupplyChain.connect(distributor).transferCustody(
          1,
          pharmacy.address,
          "Location"
        )
      ).to.be.revertedWithCustomError(medicalSupplyChain, "NotCurrentHolder");
    });

    it("Should revert if product doesn't exist", async function () {
      await expect(
        medicalSupplyChain.connect(manufacturer).transferCustody(
          999,
          distributor.address,
          "Location"
        )
      ).to.be.revertedWithCustomError(medicalSupplyChain, "ProductNotFound");
    });

    it("Should revert if transferring to zero address", async function () {
      await expect(
        medicalSupplyChain.connect(manufacturer).transferCustody(
          1,
          ethers.ZeroAddress,
          "Location"
        )
      ).to.be.revertedWithCustomError(medicalSupplyChain, "InvalidTransfer");
    });
  });

  describe("Product Verification", function () {
    beforeEach(async function () {
      await medicalSupplyChain.authorizeManufacturer(manufacturer.address, true);
      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Test Medicine",
        "BATCH-001",
        "Test Pharma",
        1000,
        1704067200,
        1767225600,
        "Antibiotic"
      );
    });

    it("Should verify existing product", async function () {
      const product = await medicalSupplyChain.verifyProduct(1);
      expect(product.id).to.equal(1);
      expect(product.isAuthentic).to.be.true;
    });

    it("Should revert for non-existent product", async function () {
      await expect(
        medicalSupplyChain.verifyProduct(999)
      ).to.be.revertedWithCustomError(medicalSupplyChain, "ProductNotFound");
    });

    it("Should return correct product details after transfer", async function () {
      await medicalSupplyChain.connect(manufacturer).transferCustody(
        1,
        distributor.address,
        "Mumbai"
      );

      const product = await medicalSupplyChain.verifyProduct(1);
      expect(product.currentHolder).to.equal(distributor.address);
      expect(product.manufacturer).to.equal(manufacturer.address);
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async function () {
      await medicalSupplyChain.authorizeManufacturer(manufacturer.address, true);
    });

    it("Should get products by manufacturer", async function () {
      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Medicine A",
        "BATCH-001",
        "Pharma",
        1000,
        1704067200,
        1767225600,
        "Antibiotic"
      );

      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Medicine B",
        "BATCH-002",
        "Pharma",
        2000,
        1704067200,
        1767225600,
        "Painkiller"
      );

      const products = await medicalSupplyChain.getProductsByManufacturer(manufacturer.address);
      expect(products.length).to.equal(2);
      expect(products[0]).to.equal(1);
      expect(products[1]).to.equal(2);
    });

    it("Should return empty array for manufacturer with no products", async function () {
      const products = await medicalSupplyChain.getProductsByManufacturer(distributor.address);
      expect(products.length).to.equal(0);
    });

    it("Should check if product exists", async function () {
      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Medicine",
        "BATCH-001",
        "Pharma",
        1000,
        1704067200,
        1767225600,
        "Antibiotic"
      );

      expect(await medicalSupplyChain.productExistsCheck(1)).to.be.true;
      expect(await medicalSupplyChain.productExistsCheck(999)).to.be.false;
    });

    it("Should get transfer count", async function () {
      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Medicine",
        "BATCH-001",
        "Pharma",
        1000,
        1704067200,
        1767225600,
        "Antibiotic"
      );

      expect(await medicalSupplyChain.getTransferCount(1)).to.equal(0);

      await medicalSupplyChain.connect(manufacturer).transferCustody(
        1,
        distributor.address,
        "Location"
      );

      expect(await medicalSupplyChain.getTransferCount(1)).to.equal(1);
    });

    it("Should get owner", async function () {
      expect(await medicalSupplyChain.getOwner()).to.equal(owner.address);
    });

    it("Should get next product ID", async function () {
      expect(await medicalSupplyChain.getNextProductId()).to.equal(1);
      
      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Medicine",
        "BATCH-001",
        "Pharma",
        1000,
        1704067200,
        1767225600,
        "Antibiotic"
      );
      
      expect(await medicalSupplyChain.getNextProductId()).to.equal(2);
    });
  });

  describe("Edge Cases", function () {
    beforeEach(async function () {
      await medicalSupplyChain.authorizeManufacturer(manufacturer.address, true);
    });

    it("Should handle empty strings in product registration", async function () {
      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "",
        "",
        "",
        0,
        0,
        0,
        ""
      );

      const product = await medicalSupplyChain.verifyProduct(1);
      expect(product.name).to.equal("");
      expect(product.quantity).to.equal(0);
    });

    it("Should handle transfer to self", async function () {
      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Medicine",
        "BATCH-001",
        "Pharma",
        1000,
        1704067200,
        1767225600,
        "Antibiotic"
      );

      await medicalSupplyChain.connect(manufacturer).transferCustody(
        1,
        manufacturer.address,
        "Same Location"
      );

      const product = await medicalSupplyChain.verifyProduct(1);
      expect(product.currentHolder).to.equal(manufacturer.address);

      const history = await medicalSupplyChain.getTransferHistory(1);
      expect(history.length).to.equal(1);
    });

    it("Should handle multiple rapid transfers", async function () {
      await medicalSupplyChain.connect(manufacturer).registerProduct(
        "Medicine",
        "BATCH-001",
        "Pharma",
        1000,
        1704067200,
        1767225600,
        "Antibiotic"
      );

      for (let i = 0; i < 5; i++) {
        const to = i % 2 === 0 ? distributor.address : manufacturer.address;
        const from = i % 2 === 0 ? manufacturer : distributor;
        
        await medicalSupplyChain.connect(from).transferCustody(
          1,
          to,
          `Location ${i}`
        );
      }

      const history = await medicalSupplyChain.getTransferHistory(1);
      expect(history.length).to.equal(5);
    });
  });
});
