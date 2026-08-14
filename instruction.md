# How This Project Works

There are two important files:

- `instruction.md` → Defines how the system should behave.
- `project_specs.md` → Defines what we are building.

The agent must follow both.

---

# Project Overview: Hybrid Repair Service & E-Commerce Platform

This project is a hybrid web application built for a mobile phone and tablet repair business that also sells used devices and accessories. The platform must handle two distinct user journeys seamlessly: booking a repair service and purchasing items from an online store.

## 1. Design & Development Workflow
* **UI/UX Prototyping:** All interface designs and layouts will be created in **Stitch** first.
* **Agent Implementation:** The Antigravity agent must reference the provided Stitch designs (or instructions based directly on them) before building or altering UI components. The agent's primary UI role is to accurately translate these Stitch designs into functional React JS and Tailwind CSS code.

## 2. Tech Stack Requirements
* **Frontend Library:** React JS (already configured)
* **Styling:** Tailwind CSS + daisy ui (already configured)
* **State Management:** Zustand (Used to manage the shopping cart and the multi-step repair booking session state) 
* **Architecture Pattern:** Feature-based folder structure (e.g., separating `features/shop` from `features/repair-tickets`). (already configured)
* **Backend:** Node.js + express js (already configured)
* **Database:** MongoDB (hosted on Atlas) - chosen to handle both structured e-commerce product data and unstructured repair intake notes (already configured)

## 3. Core Features & Business Logic

### A. The Service & Repair System
* **Intake & Booking Funnel:** A multi-step form where customers select their device brand, specific model, and the issue (e.g., cracked screen, charging port, non-functioning buttons, audio outputs).
* **Ticket Tracking System:** A secure portal where customers can enter their phone number or ticket ID to check their repair status (e.g., "Waiting for Parts", "In Progress", "Ready for Pickup").
* **Pricing Estimator:** A matrix displaying starting prices for common repairs.

### B. The E-Commerce Shop
* **Categorized Inventory:** Distinct sections for used phones, tablets, chargers, headphones, unbreakable glass, and watches.
* **Condition Grading System:** Visual tags for used devices indicating their condition (e.g., "Like New", "Refurbished", "Minor Scratches").
* **Cross-Selling Logic:** When a user books a screen repair, the checkout flow should suggest adding a screen protector or case to the order.

## 4. Critical Design & Architecture Rules
* **Separation of Concerns:** Do not mix the checkout flows. A user buying a physical product (like headphones) uses a standard e-commerce shopping cart. A user booking a repair uses an appointment/intake form. These funnels must remain visually and functionally separate until the final payment or confirmation step.
* **Database Schema Split:** Ensure the schema clearly separates Product documents (with strict pricing and inventory rules) from Service Ticket documents (which require status tracking and dynamic customer notes).

## 5.Very Important Note

Wait for approval from me 