# LabMapper

**LabMapper** is a modern, standalone web application designed to document, visualize, and diagram your homelab infrastructure. It allows you to track and generate network diagrams of your hardware, locations, services, and network connections.

[LabMapper](https://8thproject-git.github.io/labmapper/)

## Features

-   **Infrastructure Tracking:**
    -   **Hardware:** Manage servers, switches, routers, NAS, APs, and more with detailed specs (CPU, RAM, Storage, Ports).
    -   **Services:** Track VMs, LXC containers, Docker containers, and applications hosted on your hardware.
    -   **Locations:** Organize your gear by physical location (e.g., Rack, Server Room, Basement).
    -   **Connections:** Define physical cabling between devices and ports.

-   **Visualization & Dashboard:**
    -   Get an instant overview of your lab with stats and breakdown charts.
    -   Visual cards for hardware and services with status indicators and icons.

-   **Automatic Diagram Generation (Draw.io):**
    -   Generate a complete, hierarchical architecture diagram of your lab with a single click.
    -   Exports directly to `.drawio` (XML) format, compatible with [draw.io](https://app.diagrams.net/) and VS Code extensions.
    -   **Smart Rendering:** Automatically nests VMs and containers inside their physical hosts.

-   **Data Management:**
    -   **Import/Export:** Save your configuration to a JSON file for backup or transfer.
    -   **Local Storage:** Your data is automatically saved to your browser's local storage.

## Getting Started

1.  **Open the App:** Simply open `./index.html` in any modern web browser. No backend server or installation is required.
2.  **Add Inventory:** Use the "Add" button (Floating Action Button) to populate your Locations, Hardware, and Services.
3.  **Define Connections:** Link your devices port-to-port in the Connections view.
4.  **Generate Diagram:** Click "Drawio XML" in the sidebar to download your architecture diagram.

## Project Structure

-   `./index.html`: The main application entry point.
-   `./static/js/app.js`: Core logic for state management, UI rendering, and Draw.io XML generation.
-   `./static/css/style.css`: Styling and theming.
-   `example_configuration.json`: A sample configuration file to get you started.

## Technologies

-   **HTML5 / CSS3 / JavaScript (ES6+)**: Pure frontend implementation.
-   **Bootstrap 5**: Responsive layout and components.
-   **FontAwesome**: Scalable vector icons.
-   **Draw.io XML Format**: Standardized diagram output.

---
*Created for homelab enthusiasts to simplify documentation and visualization.*
