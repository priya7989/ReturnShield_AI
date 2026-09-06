# ReturnShield AI — E-Commerce Return & Refund Policy

> **TEMPORARY KNOWLEDGE BASE NOTICE (Step 2)**:
> This document serves as the local knowledge source for Policy Agent rule retrieval in Step 2.
> In Step 3, this file will be indexed into a Vector Database (ChromaDB) for production RAG (Retrieval-Augmented Generation).

---

## 1. Standard Return Windows

- **Damaged Products**: Items arriving damaged or with cracked components must be reported within **7 days** of delivery. Photo evidence is required.
- **Defective / Faulty Items**: Products with functional defect or hardware failure are eligible for return/replacement within **30 days** of delivery under seller warranty.
- **Wrong Item Received**: Discrepancies in delivered item model or specifications must be reported within **14 days** of delivery.
- **Missing Accessories**: Missing parts or cables must be claimed within **7 days** of delivery.
- **Buyer Remorse / Changed Mind**: Unopened items in original sealed packaging may be returned within **14 days** of delivery. Opened buyer remorse returns are ineligible.

---

## 2. Category-Specific Guidelines

- **Smartphones & Laptops**: High-value electronics require photo evidence of physical condition prior to return label generation.
- **Audio & Accessories**: Returned items must include original box and bundled cables.
- **Monitors & Displays**: Defective pixel claims require 3+ dead pixels or visible panel defect.

---

## 3. Risk & Human Review Escalation Rules

- **High Value Threshold**: Any return request for an order exceeding **$500.00** with ambiguous complaint evidence requires supervisor human review.
- **Serial Returner Policy**: Customers with a return ratio exceeding **20%** across 5+ past orders or multiple claims within 30 days require secondary fraud risk evaluation.
- **Ineligible Claims**: Requests submitted after the maximum return window (e.g., >30 days) are automatically rejected.
