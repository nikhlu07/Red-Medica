#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod medical_supply_chain {
    use ink::storage::Mapping;
    use ink::prelude::vec::Vec;
    use ink::prelude::string::String;

    /// Product information stored on blockchain
    #[derive(scale::Decode, scale::Encode, Clone, PartialEq, Eq, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct Product {
        pub id: u32,
        pub name: String,
        pub batch_number: String,
        pub manufacturer: AccountId,
        pub manufacturer_name: String,
        pub quantity: u32,
        pub mfg_date: u64, // timestamp
        pub expiry_date: u64, // timestamp
        pub category: String,
        pub current_holder: AccountId,
        pub is_authentic: bool,
        pub created_at: u64,
    }

    /// Transfer record for supply chain tracking
    #[derive(scale::Decode, scale::Encode, Clone, PartialEq, Eq, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct Transfer {
        pub product_id: u32,
        pub from: AccountId,
        pub to: AccountId,
        pub timestamp: u64,
        pub location: String,
        pub verified: bool,
    }

    /// Contract storage
    #[ink(storage)]
    pub struct MedicalSupplyChain {
        /// Product registry
        products: Mapping<u32, Product>,
        /// Transfer history for each product
        transfers: Mapping<u32, Vec<Transfer>>,
        /// Next product ID
        next_product_id: u32,
        /// Contract owner
        owner: AccountId,
        /// Authorized manufacturers
        manufacturers: Mapping<AccountId, bool>,
    }

    /// Events
    #[ink(event)]
    pub struct ProductRegistered {
        #[ink(topic)]
        product_id: u32,
        #[ink(topic)]
        manufacturer: AccountId,
        name: String,
        batch_number: String,
    }

    #[ink(event)]
    pub struct CustodyTransferred {
        #[ink(topic)]
        product_id: u32,
        #[ink(topic)]
        from: AccountId,
        #[ink(topic)]
        to: AccountId,
        location: String,
    }

    #[ink(event)]
    pub struct ManufacturerAuthorized {
        #[ink(topic)]
        manufacturer: AccountId,
        authorized: bool,
    }

    /// Errors
    #[derive(scale::Decode, scale::Encode, Clone, PartialEq, Eq, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// Product not found
        ProductNotFound,
        /// Not authorized manufacturer
        NotAuthorizedManufacturer,
        /// Not current holder
        NotCurrentHolder,
        /// Only owner can perform this action
        OnlyOwner,
        /// Product already exists
        ProductAlreadyExists,
        /// Invalid transfer
        InvalidTransfer,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl MedicalSupplyChain {
        /// Constructor
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            let mut manufacturers = Mapping::default();
            manufacturers.insert(caller, &true); // Owner is automatically a manufacturer
            
            Self {
                products: Mapping::default(),
                transfers: Mapping::default(),
                next_product_id: 1,
                owner: caller,
                manufacturers,
            }
        }

        /// Register a new product (only authorized manufacturers)
        #[ink(message)]
        pub fn register_product(
            &mut self,
            name: String,
            batch_number: String,
            manufacturer_name: String,
            quantity: u32,
            mfg_date: u64,
            expiry_date: u64,
            category: String,
        ) -> Result<u32> {
            let caller = self.env().caller();
            
            // Check if caller is authorized manufacturer
            if !self.manufacturers.get(caller).unwrap_or(false) {
                return Err(Error::NotAuthorizedManufacturer);
            }

            let product_id = self.next_product_id;
            let current_time = self.env().block_timestamp();

            let product = Product {
                id: product_id,
                name: name.clone(),
                batch_number: batch_number.clone(),
                manufacturer: caller,
                manufacturer_name,
                quantity,
                mfg_date,
                expiry_date,
                category,
                current_holder: caller,
                is_authentic: true,
                created_at: current_time,
            };

            self.products.insert(product_id, &product);
            self.transfers.insert(product_id, &Vec::<Transfer>::new());
            self.next_product_id += 1;

            // Emit event
            self.env().emit_event(ProductRegistered {
                product_id,
                manufacturer: caller,
                name,
                batch_number,
            });

            Ok(product_id)
        }

        /// Transfer custody of a product
        #[ink(message)]
        pub fn transfer_custody(
            &mut self,
            product_id: u32,
            to: AccountId,
            location: String,
        ) -> Result<()> {
            let caller = self.env().caller();
            
            // Get product
            let mut product = self.products.get(product_id).ok_or(Error::ProductNotFound)?;
            
            // Check if caller is current holder
            if product.current_holder != caller {
                return Err(Error::NotCurrentHolder);
            }

            // Update product holder
            product.current_holder = to;
            self.products.insert(product_id, &product);

            // Add transfer record
            let mut transfers = self.transfers.get(product_id).unwrap_or_default();
            let transfer = Transfer {
                product_id,
                from: caller,
                to,
                timestamp: self.env().block_timestamp(),
                location: location.clone(),
                verified: true,
            };
            transfers.push(transfer);
            self.transfers.insert(product_id, &transfers);

            // Emit event
            self.env().emit_event(CustodyTransferred {
                product_id,
                from: caller,
                to,
                location,
            });

            Ok(())
        }

        /// Verify product authenticity
        #[ink(message)]
        pub fn verify_product(&self, product_id: u32) -> Option<Product> {
            self.products.get(product_id)
        }

        /// Get product transfer history
        #[ink(message)]
        pub fn get_transfer_history(&self, product_id: u32) -> Vec<Transfer> {
            self.transfers.get(product_id).unwrap_or_default()
        }

        /// Authorize a manufacturer (only owner)
        #[ink(message)]
        pub fn authorize_manufacturer(&mut self, manufacturer: AccountId, authorized: bool) -> Result<()> {
            let caller = self.env().caller();
            
            if caller != self.owner {
                return Err(Error::OnlyOwner);
            }

            self.manufacturers.insert(manufacturer, &authorized);

            self.env().emit_event(ManufacturerAuthorized {
                manufacturer,
                authorized,
            });

            Ok(())
        }

        /// Check if account is authorized manufacturer
        #[ink(message)]
        pub fn is_authorized_manufacturer(&self, account: AccountId) -> bool {
            self.manufacturers.get(account).unwrap_or(false)
        }

        /// Get contract owner
        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        /// Get next product ID
        #[ink(message)]
        pub fn get_next_product_id(&self) -> u32 {
            self.next_product_id
        }

        /// Get all products by manufacturer
        #[ink(message)]
        pub fn get_products_by_manufacturer(&self, manufacturer: AccountId) -> Vec<u32> {
            let mut product_ids = Vec::new();
            
            // Note: In a real implementation, you'd want to maintain an index
            // This is a simplified version for demo purposes
            for i in 1..self.next_product_id {
                if let Some(product) = self.products.get(i) {
                    if product.manufacturer == manufacturer {
                        product_ids.push(i);
                    }
                }
            }
            
            product_ids
        }
    }

    /// Unit tests
    #[cfg(test)]
    mod tests {
        use super::*;

        // Helper function to create test accounts
        fn get_test_accounts() -> ink::env::test::DefaultAccounts<ink::env::DefaultEnvironment> {
            ink::env::test::default_accounts::<ink::env::DefaultEnvironment>()
        }

        // Helper function to set up contract with authorized manufacturer
        fn setup_contract_with_manufacturer() -> (MedicalSupplyChain, ink::env::test::DefaultAccounts<ink::env::DefaultEnvironment>) {
            let accounts = get_test_accounts();
            let mut contract = MedicalSupplyChain::new();
            
            // Authorize Bob as manufacturer
            contract.authorize_manufacturer(accounts.bob, true).unwrap();
            
            (contract, accounts)
        }

        // Helper function to register a test product
        fn register_test_product(contract: &mut MedicalSupplyChain) -> u32 {
            contract.register_product(
                "Test Medicine".to_string(),
                "BATCH-001".to_string(),
                "Test Pharma Ltd".to_string(),
                1000,
                1704067200000, // Jan 1, 2024
                1767225600000, // Jan 1, 2026
                "Antibiotic".to_string(),
            ).unwrap()
        }

        // ===== CONSTRUCTOR TESTS =====

        #[ink::test]
        fn new_works() {
            let contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            assert_eq!(contract.get_next_product_id(), 1);
            assert_eq!(contract.get_owner(), accounts.alice);
            assert!(contract.is_authorized_manufacturer(accounts.alice)); // Owner is auto-authorized
        }

        // ===== PRODUCT REGISTRATION TESTS =====

        #[ink::test]
        fn register_product_with_valid_inputs_works() {
            let mut contract = MedicalSupplyChain::new();
            
            let result = contract.register_product(
                "Amoxicillin 500mg".to_string(),
                "BATCH-001".to_string(),
                "PharmaCorp Ltd".to_string(),
                10000,
                1704067200000, // Jan 1, 2024
                1767225600000, // Jan 1, 2026
                "Antibiotic".to_string(),
            );
            
            assert!(result.is_ok());
            assert_eq!(result.unwrap(), 1);
            
            // Verify product was stored correctly
            let product = contract.verify_product(1).unwrap();
            assert_eq!(product.id, 1);
            assert_eq!(product.name, "Amoxicillin 500mg");
            assert_eq!(product.batch_number, "BATCH-001");
            assert_eq!(product.manufacturer_name, "PharmaCorp Ltd");
            assert_eq!(product.quantity, 10000);
            assert_eq!(product.mfg_date, 1704067200000);
            assert_eq!(product.expiry_date, 1767225600000);
            assert_eq!(product.category, "Antibiotic");
            assert!(product.is_authentic);
            assert_eq!(product.current_holder, get_test_accounts().alice);
            
            // Verify next product ID incremented
            assert_eq!(contract.get_next_product_id(), 2);
        }

        #[ink::test]
        fn register_product_with_empty_name_works() {
            let mut contract = MedicalSupplyChain::new();
            
            let result = contract.register_product(
                "".to_string(), // Empty name
                "BATCH-001".to_string(),
                "PharmaCorp Ltd".to_string(),
                10000,
                1704067200000,
                1767225600000,
                "Antibiotic".to_string(),
            );
            
            // Should work - validation is handled at frontend level
            assert!(result.is_ok());
        }

        #[ink::test]
        fn register_product_with_zero_quantity_works() {
            let mut contract = MedicalSupplyChain::new();
            
            let result = contract.register_product(
                "Test Medicine".to_string(),
                "BATCH-001".to_string(),
                "PharmaCorp Ltd".to_string(),
                0, // Zero quantity
                1704067200000,
                1767225600000,
                "Antibiotic".to_string(),
            );
            
            // Should work - business logic validation at frontend
            assert!(result.is_ok());
        }

        #[ink::test]
        fn register_multiple_products_works() {
            let mut contract = MedicalSupplyChain::new();
            
            // Register first product
            let product_id_1 = contract.register_product(
                "Medicine A".to_string(),
                "BATCH-001".to_string(),
                "Pharma A".to_string(),
                1000,
                1704067200000,
                1767225600000,
                "Antibiotic".to_string(),
            ).unwrap();
            
            // Register second product
            let product_id_2 = contract.register_product(
                "Medicine B".to_string(),
                "BATCH-002".to_string(),
                "Pharma B".to_string(),
                2000,
                1704067200000,
                1767225600000,
                "Painkiller".to_string(),
            ).unwrap();
            
            assert_eq!(product_id_1, 1);
            assert_eq!(product_id_2, 2);
            assert_eq!(contract.get_next_product_id(), 3);
            
            // Verify both products exist
            assert!(contract.verify_product(1).is_some());
            assert!(contract.verify_product(2).is_some());
        }

        #[ink::test]
        fn register_product_unauthorized_manufacturer_fails() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            // Set caller to Bob (not authorized)
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            
            let result = contract.register_product(
                "Test Product".to_string(),
                "BATCH-001".to_string(),
                "Test Manufacturer".to_string(),
                1000,
                1704067200000,
                1767225600000,
                "Test".to_string(),
            );
            
            assert_eq!(result, Err(Error::NotAuthorizedManufacturer));
            
            // Verify no product was created
            assert!(contract.verify_product(1).is_none());
            assert_eq!(contract.get_next_product_id(), 1);
        }

        // ===== CUSTODY TRANSFER TESTS =====

        #[ink::test]
        fn transfer_custody_with_valid_authorization_works() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            // Register product as Alice (owner/manufacturer)
            let product_id = register_test_product(&mut contract);
            
            // Transfer custody to Bob
            let result = contract.transfer_custody(
                product_id,
                accounts.bob,
                "Mumbai, India".to_string(),
            );
            
            assert!(result.is_ok());
            
            // Verify product holder changed
            let product = contract.verify_product(product_id).unwrap();
            assert_eq!(product.current_holder, accounts.bob);
            
            // Verify transfer history
            let transfers = contract.get_transfer_history(product_id);
            assert_eq!(transfers.len(), 1);
            assert_eq!(transfers[0].product_id, product_id);
            assert_eq!(transfers[0].from, accounts.alice);
            assert_eq!(transfers[0].to, accounts.bob);
            assert_eq!(transfers[0].location, "Mumbai, India");
            assert!(transfers[0].verified);
        }

        #[ink::test]
        fn transfer_custody_chain_works() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            // Register product as Alice
            let product_id = register_test_product(&mut contract);
            
            // Transfer Alice -> Bob
            contract.transfer_custody(
                product_id,
                accounts.bob,
                "Mumbai, India".to_string(),
            ).unwrap();
            
            // Transfer Bob -> Charlie
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            contract.transfer_custody(
                product_id,
                accounts.charlie,
                "Delhi, India".to_string(),
            ).unwrap();
            
            // Verify final holder
            let product = contract.verify_product(product_id).unwrap();
            assert_eq!(product.current_holder, accounts.charlie);
            
            // Verify complete transfer history
            let transfers = contract.get_transfer_history(product_id);
            assert_eq!(transfers.len(), 2);
            
            // First transfer
            assert_eq!(transfers[0].from, accounts.alice);
            assert_eq!(transfers[0].to, accounts.bob);
            assert_eq!(transfers[0].location, "Mumbai, India");
            
            // Second transfer
            assert_eq!(transfers[1].from, accounts.bob);
            assert_eq!(transfers[1].to, accounts.charlie);
            assert_eq!(transfers[1].location, "Delhi, India");
        }

        #[ink::test]
        fn transfer_custody_not_current_holder_fails() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            // Register product as Alice
            let product_id = register_test_product(&mut contract);
            
            // Try to transfer as Bob (not current holder)
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            let result = contract.transfer_custody(
                product_id,
                accounts.charlie,
                "Mumbai, India".to_string(),
            );
            
            assert_eq!(result, Err(Error::NotCurrentHolder));
            
            // Verify product holder unchanged
            let product = contract.verify_product(product_id).unwrap();
            assert_eq!(product.current_holder, accounts.alice);
            
            // Verify no transfer recorded
            let transfers = contract.get_transfer_history(product_id);
            assert_eq!(transfers.len(), 0);
        }

        #[ink::test]
        fn transfer_custody_nonexistent_product_fails() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            let result = contract.transfer_custody(
                999, // Non-existent product
                accounts.bob,
                "Mumbai, India".to_string(),
            );
            
            assert_eq!(result, Err(Error::ProductNotFound));
        }

        #[ink::test]
        fn transfer_custody_to_self_works() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            let product_id = register_test_product(&mut contract);
            
            // Transfer to self
            let result = contract.transfer_custody(
                product_id,
                accounts.alice, // Same as current holder
                "Same Location".to_string(),
            );
            
            assert!(result.is_ok());
            
            // Verify transfer was recorded
            let transfers = contract.get_transfer_history(product_id);
            assert_eq!(transfers.len(), 1);
            assert_eq!(transfers[0].from, accounts.alice);
            assert_eq!(transfers[0].to, accounts.alice);
        }

        // ===== PRODUCT VERIFICATION TESTS =====

        #[ink::test]
        fn verify_existing_product_works() {
            let mut contract = MedicalSupplyChain::new();
            
            let product_id = register_test_product(&mut contract);
            
            let product = contract.verify_product(product_id);
            assert!(product.is_some());
            
            let product = product.unwrap();
            assert_eq!(product.id, product_id);
            assert_eq!(product.name, "Test Medicine");
            assert!(product.is_authentic);
        }

        #[ink::test]
        fn verify_nonexistent_product_returns_none() {
            let contract = MedicalSupplyChain::new();
            
            let product = contract.verify_product(999);
            assert!(product.is_none());
        }

        #[ink::test]
        fn verify_product_after_transfer_works() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            let product_id = register_test_product(&mut contract);
            
            // Transfer custody
            contract.transfer_custody(
                product_id,
                accounts.bob,
                "Mumbai, India".to_string(),
            ).unwrap();
            
            // Verify product still exists and shows new holder
            let product = contract.verify_product(product_id).unwrap();
            assert_eq!(product.current_holder, accounts.bob);
            assert!(product.is_authentic);
        }

        #[ink::test]
        fn get_transfer_history_empty_for_new_product() {
            let mut contract = MedicalSupplyChain::new();
            
            let product_id = register_test_product(&mut contract);
            
            let transfers = contract.get_transfer_history(product_id);
            assert_eq!(transfers.len(), 0);
        }

        #[ink::test]
        fn get_transfer_history_nonexistent_product_returns_empty() {
            let contract = MedicalSupplyChain::new();
            
            let transfers = contract.get_transfer_history(999);
            assert_eq!(transfers.len(), 0);
        }

        // ===== MANUFACTURER AUTHORIZATION TESTS =====

        #[ink::test]
        fn authorize_manufacturer_by_owner_works() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            // Initially Bob is not authorized
            assert!(!contract.is_authorized_manufacturer(accounts.bob));
            
            // Owner authorizes Bob
            let result = contract.authorize_manufacturer(accounts.bob, true);
            assert!(result.is_ok());
            
            // Bob is now authorized
            assert!(contract.is_authorized_manufacturer(accounts.bob));
        }

        #[ink::test]
        fn authorize_manufacturer_by_non_owner_fails() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            // Set caller to Bob (not owner)
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            
            let result = contract.authorize_manufacturer(accounts.charlie, true);
            assert_eq!(result, Err(Error::OnlyOwner));
            
            // Charlie should not be authorized
            assert!(!contract.is_authorized_manufacturer(accounts.charlie));
        }

        #[ink::test]
        fn revoke_manufacturer_authorization_works() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            // Authorize Bob
            contract.authorize_manufacturer(accounts.bob, true).unwrap();
            assert!(contract.is_authorized_manufacturer(accounts.bob));
            
            // Revoke authorization
            contract.authorize_manufacturer(accounts.bob, false).unwrap();
            assert!(!contract.is_authorized_manufacturer(accounts.bob));
        }

        #[ink::test]
        fn owner_is_always_authorized_manufacturer() {
            let contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            assert!(contract.is_authorized_manufacturer(accounts.alice));
        }

        #[ink::test]
        fn authorized_manufacturer_can_register_products() {
            let (mut contract, accounts) = setup_contract_with_manufacturer();
            
            // Set caller to Bob (authorized manufacturer)
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            
            let result = contract.register_product(
                "Bob's Medicine".to_string(),
                "BOB-BATCH-001".to_string(),
                "Bob's Pharma".to_string(),
                500,
                1704067200000,
                1767225600000,
                "Painkiller".to_string(),
            );
            
            assert!(result.is_ok());
            
            let product = contract.verify_product(result.unwrap()).unwrap();
            assert_eq!(product.manufacturer, accounts.bob);
            assert_eq!(product.manufacturer_name, "Bob's Pharma");
        }

        #[ink::test]
        fn revoked_manufacturer_cannot_register_products() {
            let (mut contract, accounts) = setup_contract_with_manufacturer();
            
            // Revoke Bob's authorization
            contract.authorize_manufacturer(accounts.bob, false).unwrap();
            
            // Set caller to Bob
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            
            let result = contract.register_product(
                "Bob's Medicine".to_string(),
                "BOB-BATCH-001".to_string(),
                "Bob's Pharma".to_string(),
                500,
                1704067200000,
                1767225600000,
                "Painkiller".to_string(),
            );
            
            assert_eq!(result, Err(Error::NotAuthorizedManufacturer));
        }

        // ===== UTILITY FUNCTION TESTS =====

        #[ink::test]
        fn get_owner_works() {
            let contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            assert_eq!(contract.get_owner(), accounts.alice);
        }

        #[ink::test]
        fn get_next_product_id_increments() {
            let mut contract = MedicalSupplyChain::new();
            
            assert_eq!(contract.get_next_product_id(), 1);
            
            register_test_product(&mut contract);
            assert_eq!(contract.get_next_product_id(), 2);
            
            register_test_product(&mut contract);
            assert_eq!(contract.get_next_product_id(), 3);
        }

        #[ink::test]
        fn get_products_by_manufacturer_works() {
            let (mut contract, accounts) = setup_contract_with_manufacturer();
            
            // Alice registers a product
            let product_id_1 = register_test_product(&mut contract);
            
            // Bob registers a product
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            let product_id_2 = contract.register_product(
                "Bob's Medicine".to_string(),
                "BOB-BATCH-001".to_string(),
                "Bob's Pharma".to_string(),
                500,
                1704067200000,
                1767225600000,
                "Painkiller".to_string(),
            ).unwrap();
            
            // Alice registers another product
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            let product_id_3 = register_test_product(&mut contract);
            
            // Check Alice's products
            let alice_products = contract.get_products_by_manufacturer(accounts.alice);
            assert_eq!(alice_products.len(), 2);
            assert!(alice_products.contains(&product_id_1));
            assert!(alice_products.contains(&product_id_3));
            
            // Check Bob's products
            let bob_products = contract.get_products_by_manufacturer(accounts.bob);
            assert_eq!(bob_products.len(), 1);
            assert!(bob_products.contains(&product_id_2));
            
            // Check Charlie's products (should be empty)
            let charlie_products = contract.get_products_by_manufacturer(accounts.charlie);
            assert_eq!(charlie_products.len(), 0);
        }

        #[ink::test]
        fn get_products_by_manufacturer_empty_for_no_products() {
            let contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            let products = contract.get_products_by_manufacturer(accounts.bob);
            assert_eq!(products.len(), 0);
        }

        // ===== EDGE CASE TESTS =====

        #[ink::test]
        fn multiple_transfers_same_product_works() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            let product_id = register_test_product(&mut contract);
            
            // Multiple rapid transfers
            for i in 0..5 {
                let to = if i % 2 == 0 { accounts.bob } else { accounts.alice };
                let location = format!("Location {}", i);
                
                contract.transfer_custody(product_id, to, location).unwrap();
                
                // Switch caller for next transfer
                ink::env::test::set_caller::<ink::env::DefaultEnvironment>(to);
            }
            
            let transfers = contract.get_transfer_history(product_id);
            assert_eq!(transfers.len(), 5);
        }

        #[ink::test]
        fn product_data_integrity_after_transfers() {
            let mut contract = MedicalSupplyChain::new();
            let accounts = get_test_accounts();
            
            let product_id = register_test_product(&mut contract);
            let original_product = contract.verify_product(product_id).unwrap();
            
            // Transfer multiple times
            contract.transfer_custody(product_id, accounts.bob, "Location 1".to_string()).unwrap();
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            contract.transfer_custody(product_id, accounts.charlie, "Location 2".to_string()).unwrap();
            
            let final_product = contract.verify_product(product_id).unwrap();
            
            // Verify all data except current_holder remains unchanged
            assert_eq!(original_product.id, final_product.id);
            assert_eq!(original_product.name, final_product.name);
            assert_eq!(original_product.batch_number, final_product.batch_number);
            assert_eq!(original_product.manufacturer, final_product.manufacturer);
            assert_eq!(original_product.manufacturer_name, final_product.manufacturer_name);
            assert_eq!(original_product.quantity, final_product.quantity);
            assert_eq!(original_product.mfg_date, final_product.mfg_date);
            assert_eq!(original_product.expiry_date, final_product.expiry_date);
            assert_eq!(original_product.category, final_product.category);
            assert_eq!(original_product.is_authentic, final_product.is_authentic);
            assert_eq!(original_product.created_at, final_product.created_at);
            
            // Only current_holder should change
            assert_ne!(original_product.current_holder, final_product.current_holder);
            assert_eq!(final_product.current_holder, accounts.charlie);
        }
    }
}