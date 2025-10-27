-- Add vendor_profiles table to store IT/Security Assessment, Performance & Operational, and Internal Procurement fields
USE u468634218_inventos;

CREATE TABLE IF NOT EXISTS vendor_profiles (
  vendor_id VARCHAR(32) NOT NULL,
  data_protection_ack TINYINT(1) DEFAULT 0,
  network_endpoint_overview TEXT NULL,
  authorized_hardware JSON NULL,
  support_warranty TEXT NULL,
  -- files (information_security_policy, oem_authorization, escalation_matrix) are stored in vendor_documents table
  years_in_hardware_supply INT NULL,
  key_clients TEXT NULL,
  avg_delivery_timeline_value INT NULL,
  avg_delivery_timeline_unit VARCHAR(16) NULL,
  after_sales_support TEXT NULL,
  -- internal procurement
  request_type ENUM('New Vendor','Renewal') DEFAULT 'New Vendor',
  business_justification TEXT NULL,
  estimated_annual_spend DECIMAL(15,2) NULL,
  evaluation_committee JSON NULL, -- list of user ids/emails
  risk_assessment ENUM('High','Moderate','Low') DEFAULT 'Moderate',
  legal_infosec_review_status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (vendor_id),
  CONSTRAINT fk_vendor_profiles_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
