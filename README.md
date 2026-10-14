# Didactic ESL ATM - v2.0.0 (ATM 2.0)

Welcome to the Didactic ESL ATM Application! Built specifically for classroom educators to seamlessly manage a digital classroom token economy, loan mechanics, store privileges, and financial literacy.

---

## 🚀 What's New in Version 2.0.0

### 🌓 Full App Dark & Light Mode
- **Classroom Projector Ready:** Switch effortlessly between a high-contrast Light Theme (ideal for brightly lit classrooms and smartboard projectors) and the sleek Dark Theme.
- **Universal Theming:** Automatically synchronizes across all teacher dashboards, telemetry cards, student portals, printable studios, ledger tables, and dialog modals.
- **Card Aesthetics Preserved:** Physical simulated credit cards retain their rich metallic themes (Sapphire, Gold, Emerald, Obsidian, Ruby).

### 🖥️ Native Window Shell & macOS/WinUI Controls
- **Smooth Window Dragging:** Built-in `data-tauri-drag-region` and programmatic window dragging allow moving the application naturally from anywhere on the title bar.
- **Functional Window Traffic Lights:** Close (🔴), Minimize (🟡), and Maximize/Restore (🟢) buttons wired directly into native Tauri window APIs.
- **Cleaned Title Bar:** Streamlined header display featuring "ESL Central Terminal" and the instant theme switcher.

### 📐 Auto-Hiding Left Navigation Sidebar
- **100% Full-Screen Space:** Left sidebar automatically collapses off-screen to maximize usable screen real estate.
- **Smooth Hover & Grab Tab:** Move the mouse toward the left edge or click the glowing `NAV` grab tab to reveal the navigation menu.
- **Pin Option:** Includes a `📌 Pin` toggle to lock the sidebar open whenever preferred.

### 🛍️ Minimalist Store Vector Icons & Collision Fix
- **Crisp Vector Visuals:** Replaced complex drawings with clean, minimalist Lucide vector icons (`BookCheck`, `DoorOpen`, `Star`, `Clock`, `Dices`, `Gift`, `Package`) that scale without overflowing.
- **Custom Emojis:** Centered typography rendering for teacher-created reward items.
- **Dedicated Shopper Selector:** Replaced conflicting dropdowns with an isolated `ShopperPickerModal` containing a quick search bar to switch student shoppers smoothly.

### 💰 Restored Bulk Money Distribution & Deductions
- **Classroom Quick-Adjustment:** Easily award or deduct English Dollars (E$) across entire cohorts or custom-selected students.
- **Quick Preset Chips:** Rapid buttons for +10, +25, +50, +100 E$, custom reasons, and automatic ledger transaction logging.

---

## 📌 Previous Releases

### Version 1.1.0
- **Store Catalog Management:** Add new items, edit existing reward cards, and permanently remove items with confirmation.
- **Shelf Visibility (Hide/Inactive):** Temporarily shelve items without losing them; hidden items are excluded from student shopping and purchase screens.
- **Custom Visuals & Emoji Picker:** Choose preset classroom card designs or pick from custom emojis with real-time live preview.
- **Unlimited Stock Mode:** Mark rewards as always in stock with an "∞ Unlimited" badge.
- **Safe Catalog Reset:** Restore default items while safely preserving all custom added rewards.

### Version 1.0.0
- **Student Roster Management:** Add, edit, and organize students with unique ID numbers, balances, and credit scores.
- **Loans & Credit Systems:** Issue loans to students, track outstanding debts, and penalize late payments. Credit scores dynamically calculate based on loan history.
- **Integrated Print Studio:** Automatically generate beautiful, printable Credit Card cutouts for students to hold physically in the classroom.
- **Data Safety:** Built-in `.json` snapshot engine to manually backup and restore classroom state.
- **Native Desktop Experience:** Completely standalone `.exe` built in Rust (Tauri).

---

## 🔧 Installation & Download

Download the binaries from the **Assets** section of the [Latest Release](https://github.com/silencesight/ATM-/releases):

1. **Standalone Binary:** `ATM 2.0.exe` (run directly without installation)
2. **Windows Installer:** `ATM 2.0 Setup.exe` (installs cleanly to Start Menu / Desktop)
3. **MSI Package:** `ATM 2.0_2.0.0_x64_en-US.msi`

*(Note: If Windows SmartScreen displays a blue "Windows protected your PC" notification, click **More Info** -> **Run Anyway**. This is standard for indie classroom utilities!)*

---

## 📝 Notes for Teachers
- For best results in the Print Studio, print on Letter or A4 cardstock with margins set to "Default" or "None".
- Back up your data weekly using the "Export Progress Backup" option in the Teacher Hub!
