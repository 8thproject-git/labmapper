// --- State ---
const locations = [];
const hardware = [];
const services = [];
const connections = [];

// --- Auto-save Configuration ---
const AUTO_SAVE_KEY = 'homelab_config_autosave';

function saveToLocalStorage() {
    const data = {
        locations,
        hardware,
        services,
        connections,
        lastSaved: new Date().toISOString()
    };
    try {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data));
        console.log('Configuration auto-saved');
    } catch (err) {
        console.error('Failed to auto-save configuration:', err);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem(AUTO_SAVE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.locations) locations.splice(0, locations.length, ...data.locations);
            if (data.hardware) hardware.splice(0, hardware.length, ...data.hardware);
            if (data.services) services.splice(0, services.length, ...data.services);
            if (data.connections) connections.splice(0, connections.length, ...data.connections);
            console.log('Configuration loaded from auto-save');
            return true;
        }
    } catch (err) {
        console.error('Failed to load auto-saved configuration:', err);
    }
    return false;
}

// --- Sidebar Toggle (Mobile) ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// --- FAB Menu Toggle ---
function toggleFabMenu() {
    const fabMain = document.getElementById('fab-main');
    const fabMenu = document.getElementById('fab-menu');
    
    fabMain.classList.toggle('active');
    fabMenu.classList.toggle('active');
}

// Close FAB menu when clicking outside
document.addEventListener('click', function(event) {
    const fabContainer = document.querySelector('.fab-container');
    const fabMain = document.getElementById('fab-main');
    const fabMenu = document.getElementById('fab-menu');
    
    if (fabContainer && !fabContainer.contains(event.target)) {
        fabMain.classList.remove('active');
        fabMenu.classList.remove('active');
    }
});

// --- View Management ---
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    
    // Update Sidebar
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(viewName === 'overview') {
        document.getElementById('nav-overview').classList.add('active');
    } else if(viewName === 'locations' || viewName === 'add-location') {
        document.getElementById('nav-locations').classList.add('active');
    } else if (viewName.includes('hardware')) {
        document.getElementById('nav-hardware').classList.add('active');
    } else if (viewName.includes('services') || viewName.includes('service')) {
        document.getElementById('nav-services').classList.add('active');
    } else if (viewName.includes('connections') || viewName.includes('connection')) {
        document.getElementById('nav-connections').classList.add('active');
    }

    // Show specific view
    const map = {
        'overview': 'overview-view',
        'locations': 'locations-view',
        'hardware': 'hardware-view',
        'add-location': 'add-location-view',
        'add-hardware': 'add-hardware-view',
        'hardware-details': 'hardware-detail-view',
        'services': 'services-view',
        'add-service': 'add-service-view',
        'connections': 'connections-view',
        'add-connection': 'add-connection-view'
    };
    
    if(map[viewName]) document.getElementById(map[viewName]).style.display = 'block';

    // Reset forms when navigating away from add/edit views
    if(viewName === 'locations') {
        document.getElementById('location-edit-index').value = '';
        document.querySelector('#add-location-view form').reset();
    }
    if(viewName === 'hardware') {
        document.getElementById('hardware-edit-index').value = '';
        document.querySelector('#add-hardware-view form').reset();
    }
    if(viewName === 'services') {
        document.getElementById('service-edit-index').value = '';
        document.querySelector('#add-service-view form').reset();
    }
    if(viewName === 'connections') {
        document.getElementById('connection-edit-index').value = '';
        document.querySelector('#add-connection-view form').reset();
        document.getElementById('conn-source-port').innerHTML = '<option value="">Select Device First...</option>';
        document.getElementById('conn-target-port').innerHTML = '<option value="">Select Device First...</option>';
    }

    // Setup forms when entering add/edit views
    if(viewName === 'add-hardware') {
        if (document.getElementById('hardware-edit-index').value !== '') {
            // Editing mode, do nothing (fields populated by editHardware)
        } else {
            // Adding mode, clear form
            document.getElementById('hardware-form-title').textContent = 'Add Hardware';
            document.querySelector('#add-hardware-view form').reset();
            document.getElementById('hardware-edit-index').value = '';
            updateLocationDropdown();
            updateFormFields();
        }
    }
    if(viewName === 'add-location') {
        if (document.getElementById('location-edit-index').value === '') {
            document.getElementById('location-form-title').textContent = 'Add Location';
            document.querySelector('#add-location-view form').reset();
        }
    }
    if(viewName === 'add-service') {
        if (document.getElementById('service-edit-index').value === '') {
            document.getElementById('service-form-title').textContent = 'Add Service';
            document.querySelector('#add-service-view form').reset();
            updateHostDropdown();
        }
    }
    if(viewName === 'add-connection') {
        document.getElementById('connection-form-title').textContent = 'Add Connection';
        document.querySelector('#add-connection-view form').reset();
        document.getElementById('connection-edit-index').value = '';
        updateDeviceDropdowns();
        document.getElementById('conn-source-port').innerHTML = '<option value="">Select Device First...</option>';
        document.getElementById('conn-target-port').innerHTML = '<option value="">Select Device First...</option>';
    }
    if(viewName === 'overview') {
        renderOverview();
    }
    
    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('sidebar-overlay').classList.remove('active');
    }
}

// --- Renders ---
function renderLocationsList() {
    const list = document.getElementById('locations-list');
    const empty = document.getElementById('locations-empty');
    list.innerHTML = '';
    
    if(locations.length === 0) { empty.classList.remove('d-none'); return; }
    empty.classList.add('d-none');

    locations.forEach((loc, idx) => {
        const count = hardware.filter(h => h.location === loc).length;
        list.innerHTML += `
            <div class="col-md-4">
                <div class="glass-card h-100 d-flex flex-column justify-content-between">
                    <div>
                        <h5 class="fw-bold mb-1"><i class="fa-solid fa-map-pin text-primary me-2"></i>${loc}</h5>
                        <p class="text-muted small">${count} devices installed</p>
                    </div>
                    <div class="mt-3 pt-3 border-top border-secondary" style="border-color: rgba(255,255,255,0.1)!important;">
                        <button class="btn btn-sm btn-secondary-soft" onclick="editLocation(${idx})">Edit</button>
                        <button class="btn btn-sm btn-outline-danger border-0 float-end" onclick="deleteLocation(${idx})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderHardwareList() {
    const list = document.getElementById('hardware-list');
    const empty = document.getElementById('hardware-empty');
    list.innerHTML = '';

    if(hardware.length === 0) { empty.classList.remove('d-none'); return; }
    empty.classList.add('d-none');

    const icons = {
        'server': 'fa-server',
        'switch': 'fa-network-wired',
        'ap': 'fa-wifi',
        'nas': 'fa-database',
        'ups': 'fa-battery-full',
        'iot': 'fa-satellite-dish',
        'camera': 'fa-video',
        'other': 'fa-microchip'
    };

    hardware.forEach((hw, idx) => {
        const icon = icons[hw.type || 'server'] || 'fa-server';
        const svcCount = services.filter(s => s.host === hw.hostname).length;
        
        // Render specs based on type or just defaults
        let specsHtml = '';
        if (hw.type === 'switch') {
            specsHtml = `
                <div class="d-flex align-items-center mb-2"><i class="fa-solid fa-ethernet fa-fw me-2"></i> ${hw.ports || '?'} Ports</div>
                <div class="d-flex align-items-center mb-2"><i class="fa-solid fa-gauge-high fa-fw me-2"></i> ${hw.speed || 'Speed Unset'}</div>
            `;
        } else if (hw.type === 'ap') {
            specsHtml = `<div class="d-flex align-items-center mb-2"><i class="fa-solid fa-wifi fa-fw me-2"></i> ${hw.speed || 'Standard Unset'}</div>`;
        } else if (hw.type === 'ups') {
                specsHtml = `
                <div class="d-flex align-items-center mb-2"><i class="fa-solid fa-battery-half fa-fw me-2"></i> ${hw.va_rating || 'N/A VA'}</div>
                <div class="d-flex align-items-center mb-2"><i class="fa-solid fa-bolt fa-fw me-2"></i> ${hw.power || '0W'}</div>
            `;
        } else {
            // Server/Default view
                specsHtml = `
                <div class="d-flex align-items-center mb-2">
                    <i class="fa-solid fa-microchip fa-fw me-2"></i> <span class="text-truncate">${hw.cpu || 'Unknown CPU'}</span>
                </div>
                <div class="row g-0">
                    <div class="col-6 mb-2"><i class="fa-solid fa-memory fa-fw me-2"></i> ${hw.ram || 'N/A'}</div>
                    <div class="col-6 mb-2"><i class="fa-solid fa-hdd fa-fw me-2"></i> ${hw.storage || 'N/A'}</div>
                </div>
            `;
        }

        list.innerHTML += `
            <div class="glass-card hw-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-2">
                                <span class="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-25">${(hw.type || 'Server').toUpperCase()}</span>
                                ${hw.role ? `<span class="badge bg-primary bg-opacity-10 text-primary">${hw.role}</span>` : ''}
                        </div>
                        <h5 class="fw-bold text-white mb-0"><i class="fa-solid ${icon} me-2 text-muted small"></i>${hw.hostname}</h5>
                        <small class="text-muted ms-4"><i class="fa-solid fa-location-dot me-1"></i>${hw.location || 'No Location'}</small>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-link text-muted p-0" onclick="editHardware(${idx})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-link text-danger p-0" onclick="deleteHardware(${idx})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>

                <div class="small text-muted mb-4 flex-grow-1">
                    ${specsHtml}
                        <div class="row g-0 mt-2">
                        ${!['switch','ap'].includes(hw.type) ? `<div class="col-6"><i class="fa-solid fa-network-wired fa-fw me-2"></i> ${hw.ip || 'DHCP'}</div>` : ''}
                        ${hw.type !== 'ups' ? `<div class="col-6"><i class="fa-solid fa-bolt fa-fw me-2"></i> ${hw.power || '? W'}</div>` : ''}
                    </div>
                </div>

                <div class="d-flex justify-content-between align-items-center pt-3 border-top border-secondary" style="border-color: rgba(255,255,255,0.1)!important;">
                    <div class="small text-muted"><i class="fa-solid fa-layer-group me-1"></i> ${svcCount} Services</div>
                    <button class="btn btn-sm btn-secondary-soft" onclick="viewHardwareDetail(${idx})">
                        View Spec Sheet <i class="fa-solid fa-arrow-right ms-1"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

function renderServicesList() {
    const list = document.getElementById('services-list');
    const empty = document.getElementById('services-empty');
    list.innerHTML = '';

    if(services.length === 0) { empty.classList.remove('d-none'); return; }
    empty.classList.add('d-none');

    const icons = {
        'vm': 'fa-desktop',
        'lxc': 'fa-cube',
        'docker': 'fa-brands fa-docker',
        'service': 'fa-gear'
    };
    
    const typeLabels = {
        'vm': 'Virtual Machine',
        'lxc': 'LXC Container',
        'docker': 'Docker Container',
        'service': 'Application'
    };

    services.forEach((svc, idx) => {
        const icon = icons[svc.type] || 'fa-gear';
        let displayUrl = svc.url;
        let hrefUrl = svc.url;
        if (hrefUrl && !hrefUrl.match(/^https?:\/\//i)) {
            hrefUrl = 'http://' + hrefUrl;
        }

        list.innerHTML += `
            <div class="glass-card hw-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-2">
                                <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">${typeLabels[svc.type] || 'Service'}</span>
                        </div>
                        <h5 class="fw-bold text-white mb-0"><i class="fa-solid ${icon} me-2 text-muted small"></i>${svc.name}</h5>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-link text-muted p-0" onclick="editService(${idx})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-link text-danger p-0 ms-2" onclick="deleteService(${idx})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>

                <div class="small text-muted mb-4 flex-grow-1">
                    <div class="mb-2"><i class="fa-solid fa-server fa-fw me-2"></i> Hosted on: <span class="text-white">${svc.host || 'Unassigned'}</span></div>
                    <div class="mb-2"><i class="fa-solid fa-link fa-fw me-2"></i> ${svc.url ? `<a href="${hrefUrl}" target="_blank" class="text-accent text-decoration-none">${svc.url}</a>` : 'No URL'}</div>
                    <div class="mt-3 text-muted fst-italic">${svc.description || 'No description provided.'}</div>
                </div>
            </div>
        `;
    });
}
// --- Filter Functions ---
function filterHardware() {
    const filterValue = document.getElementById('hardware-type-filter').value;
    const list = document.getElementById('hardware-list');
    const empty = document.getElementById('hardware-empty');
    
    list.innerHTML = '';
    
    // Filter hardware based on selected type
    const filteredHardware = filterValue === 'all' 
        ? hardware 
        : hardware.filter(hw => hw.type === filterValue);
    
    if(filteredHardware.length === 0) { 
        empty.classList.remove('d-none'); 
        return; 
    }
    empty.classList.add('d-none');
    
    const typeLabels = {
        'server': 'Server',
        'switch': 'Switch',
        'ap': 'Access Point',
        'nas': 'NAS',
        'ups': 'UPS',
        'iot': 'IoT Device',
        'camera': 'Camera',
        'other': 'Other'
    };
    
    filteredHardware.forEach((hw, idx) => {
        // Find the original index in the hardware array
        const originalIdx = hardware.indexOf(hw);
        const svcCount = services.filter(s => s.host === hw.hostname).length;
        
        list.innerHTML += `
            <div class="glass-card hw-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">${typeLabels[hw.type] || 'Device'}</span>
                            ${hw.location ? `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25"><i class="fa-solid fa-map-pin me-1"></i>${hw.location}</span>` : ''}
                        </div>
                        <h5 class="fw-bold text-white mb-0">${hw.hostname}</h5>
                        ${hw.role ? `<div class="small text-muted">${hw.role}</div>` : ''}
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-link text-muted p-0" onclick="editHardware(${originalIdx})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-link text-danger p-0 ms-2" onclick="deleteHardware(${originalIdx})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>

                <div class="small text-muted mb-3 flex-grow-1">
                    ${hw.ip ? `<div class="mb-2"><i class="fa-solid fa-network-wired fa-fw me-2"></i> ${hw.ip}</div>` : ''}
                    ${hw.cpu ? `<div class="mb-2"><i class="fa-solid fa-microchip fa-fw me-2"></i> ${hw.cpu}</div>` : ''}
                    ${hw.ram ? `<div class="mb-2"><i class="fa-solid fa-memory fa-fw me-2"></i> ${hw.ram}</div>` : ''}
                    ${hw.storage ? `<div class="mb-2"><i class="fa-solid fa-hard-drive fa-fw me-2"></i> ${hw.storage}</div>` : ''}
                </div>

                <div class="d-flex justify-content-between align-items-center pt-3 border-top border-secondary" style="border-color: rgba(255,255,255,0.1)!important;">
                    <div class="small text-muted"><i class="fa-solid fa-layer-group me-1"></i> ${svcCount} Services</div>
                    <button class="btn btn-sm btn-secondary-soft" onclick="viewHardwareDetail(${originalIdx})">
                        View Spec Sheet <i class="fa-solid fa-arrow-right ms-1"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

function filterServices() {
    const filterValue = document.getElementById('service-type-filter').value;
    const list = document.getElementById('services-list');
    const empty = document.getElementById('services-empty');
    
    list.innerHTML = '';
    
    // Filter services based on selected type
    const filteredServices = filterValue === 'all'
        ? services
        : services.filter(svc => svc.type === filterValue);
    
    if(filteredServices.length === 0) {
        empty.classList.remove('d-none');
        return;
    }
    empty.classList.add('d-none');
    
    const icons = {
        'vm': 'fa-desktop',
        'lxc': 'fa-cube',
        'docker': 'fa-brands fa-docker',
        'service': 'fa-gear'
    };
    
    const typeLabels = {
        'vm': 'Virtual Machine',
        'lxc': 'LXC Container',
        'docker': 'Docker Container',
        'service': 'Application'
    };
    
    filteredServices.forEach((svc) => {
        // Find the original index in the services array
        const originalIdx = services.indexOf(svc);
        const icon = icons[svc.type] || 'fa-gear';
        
        let displayUrl = svc.url;
        let hrefUrl = svc.url;
        if (hrefUrl && !hrefUrl.match(/^https?:\/\//i)) {
            hrefUrl = 'http://' + hrefUrl;
        }

        list.innerHTML += `
            <div class="glass-card hw-card">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">${typeLabels[svc.type] || 'Service'}</span>
                        </div>
                        <h5 class="fw-bold text-white mb-0"><i class="fa-solid ${icon} me-2 text-muted small"></i>${svc.name}</h5>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-link text-muted p-0" onclick="editService(${originalIdx})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-link text-danger p-0 ms-2" onclick="deleteService(${originalIdx})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>

                <div class="small text-muted mb-4 flex-grow-1">
                    <div class="mb-2"><i class="fa-solid fa-server fa-fw me-2"></i> Hosted on: <span class="text-white">${svc.host || 'Unassigned'}</span></div>
                    <div class="mb-2"><i class="fa-solid fa-link fa-fw me-2"></i> ${svc.url ? `<a href="${hrefUrl}" target="_blank" class="text-accent text-decoration-none">${svc.url}</a>` : 'No URL'}</div>
                    <div class="mt-3 text-muted fst-italic">${svc.description || 'No description provided.'}</div>
                </div>
            </div>
        `;
    });
}


function renderConnectionsList() {
    const list = document.getElementById('connections-list');
    const empty = document.getElementById('connections-empty');
    list.innerHTML = '';

    if(connections.length === 0) { empty.classList.remove('d-none'); return; }
    empty.classList.add('d-none');

    connections.forEach((conn, idx) => {
        list.innerHTML += `
            <div class="col-12">
                <div class="glass-card d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-4 flex-grow-1">
                        <div class="text-end" style="width: 40%;">
                            <div class="fw-bold text-white">${conn.source_device}</div>
                            <div class="small text-muted font-monospace">${conn.source_port}</div>
                        </div>
                        <div class="text-center text-muted opacity-50">
                            <i class="fa-solid fa-arrow-right fa-lg"></i>
                        </div>
                        <div class="text-start" style="width: 40%;">
                            <div class="fw-bold text-white">${conn.target_device}</div>
                            <div class="small text-muted font-monospace">${conn.target_port}</div>
                        </div>
                    </div>
                    <button class="btn btn-link text-danger ms-3" onclick="deleteConnection(${idx})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

function renderOverview() {
    // Update stats
    document.getElementById('stat-locations').textContent = locations.length;
    document.getElementById('stat-hardware').textContent = hardware.length;
    document.getElementById('stat-services').textContent = services.length;
    document.getElementById('stat-connections').textContent = connections.length;

    // Hardware by Type
    const hwByType = {};
    const typeLabels = {
        'server': 'Servers',
        'switch': 'Switches',
        'ap': 'Access Points',
        'nas': 'NAS',
        'ups': 'UPS',
        'iot': 'IoT Devices',
        'camera': 'Cameras',
        'other': 'Other'
    };
    
    hardware.forEach(hw => {
        const type = hw.type || 'other';
        hwByType[type] = (hwByType[type] || 0) + 1;
    });

    const hwByTypeEl = document.getElementById('hardware-by-type');
    if(Object.keys(hwByType).length === 0) {
        hwByTypeEl.innerHTML = '<p class="text-muted text-center py-3">No hardware added yet</p>';
    } else {
        hwByTypeEl.innerHTML = Object.entries(hwByType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => `
                <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom border-secondary" style="border-color: rgba(255,255,255,0.1)!important;">
                    <span class="text-muted">${typeLabels[type] || type}</span>
                    <span class="badge bg-primary bg-opacity-25 text-primary px-3 py-2">${count}</span>
                </div>
            `).join('');
    }

    // Services by Type
    const svcByType = {};
    const svcTypeLabels = {
        'vm': 'Virtual Machines',
        'lxc': 'LXC Containers',
        'docker': 'Docker Containers',
        'service': 'Applications'
    };
    
    services.forEach(svc => {
        const type = svc.type || 'service';
        svcByType[type] = (svcByType[type] || 0) + 1;
    });

    const svcByTypeEl = document.getElementById('services-by-type');
    if(Object.keys(svcByType).length === 0) {
        svcByTypeEl.innerHTML = '<p class="text-muted text-center py-3">No services added yet</p>';
    } else {
        svcByTypeEl.innerHTML = Object.entries(svcByType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => `
                <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom border-secondary" style="border-color: rgba(255,255,255,0.1)!important;">
                    <span class="text-muted">${svcTypeLabels[type] || type}</span>
                    <span class="badge bg-info bg-opacity-25 text-info px-3 py-2">${count}</span>
                </div>
            `).join('');
    }

    // Locations Summary
    const locSummaryEl = document.getElementById('locations-summary');
    if(locations.length === 0) {
        locSummaryEl.innerHTML = '<p class="text-muted text-center py-3">No locations defined yet</p>';
    } else {
        locSummaryEl.innerHTML = locations.map(loc => {
            const hwCount = hardware.filter(h => h.location === loc).length;
            const hwList = hardware.filter(h => h.location === loc);
            const totalPower = hwList.reduce((sum, h) => {
                const power = parseInt(h.power) || 0;
                return sum + power;
            }, 0);
            
            return `
                <div class="row align-items-center mb-3 pb-3 border-bottom border-secondary" style="border-color: rgba(255,255,255,0.1)!important;">
                    <div class="col-md-4">
                        <h6 class="mb-0"><i class="fa-solid fa-map-pin text-primary me-2"></i>${loc}</h6>
                    </div>
                    <div class="col-md-4 text-center">
                        <span class="text-muted small">Devices: </span>
                        <span class="badge bg-secondary bg-opacity-25 text-light">${hwCount}</span>
                    </div>
                    <div class="col-md-4 text-end">
                        <span class="text-muted small">Est. Power: </span>
                        <span class="text-warning fw-bold">${totalPower}W</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Hardware List (compact view)
    const overviewHwEl = document.getElementById('overview-hardware-list');
    if(hardware.length === 0) {
        overviewHwEl.innerHTML = '<p class="text-muted text-center py-3">No hardware added yet</p>';
    } else {
        const icons = {
            'server': 'fa-server',
            'switch': 'fa-network-wired',
            'ap': 'fa-wifi',
            'nas': 'fa-database',
            'ups': 'fa-battery-full',
            'iot': 'fa-satellite-dish',
            'camera': 'fa-video',
            'other': 'fa-microchip'
        };
        
        overviewHwEl.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover">
                    <thead>
                        <tr>
                            <th>Device</th>
                            <th>Type</th>
                            <th>Location</th>
                            <th>IP Address</th>
                            <th>Services</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hardware.map((hw, idx) => {
                            const icon = icons[hw.type || 'server'] || 'fa-server';
                            const svcCount = services.filter(s => s.host === hw.hostname).length;
                            return `
                                <tr>
                                    <td>
                                        <i class="fa-solid ${icon} me-2 text-muted"></i>
                                        <strong>${hw.hostname}</strong>
                                        ${hw.role ? `<br><small class="text-muted">${hw.role}</small>` : ''}
                                    </td>
                                    <td><span class="badge bg-secondary bg-opacity-25 text-light">${(hw.type || 'server').toUpperCase()}</span></td>
                                    <td class="text-muted">${hw.location || '-'}</td>
                                    <td class="font-monospace text-info">${hw.ip || '-'}</td>
                                    <td><span class="badge bg-primary bg-opacity-25 text-primary">${svcCount}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-secondary-soft" onclick="viewHardwareDetail(${idx})">
                                            <i class="fa-solid fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}

// --- The New Page View Logic ---
function viewHardwareDetail(index) {
    const hw = hardware[index];
    const container = document.getElementById('hardware-detail-view');
    
    const nicBadges = (hw.nics || []).map(n => `<span class="badge bg-secondary me-1">${n}</span>`).join('') || '<span class="text-muted small">None</span>';

    container.innerHTML = `
        <button class="btn btn-secondary-soft mb-4" onclick="showView('hardware')">
            <i class="fa-solid fa-arrow-left me-2"></i>Back to Inventory
        </button>
        
        <div class="detail-header d-flex justify-content-between align-items-end">
            <div>
                <div class="text-uppercase text-primary fw-bold small mb-1 tracking-wide">Device Profile</div>
                <h1 class="display-5 fw-bold mb-1">${hw.hostname}</h1>
                <div class="d-flex gap-3 align-items-center text-muted">
                    <span><i class="fa-solid fa-tag me-1"></i> ${hw.role || 'General Purpose'}</span>
                    <span><i class="fa-solid fa-location-dot me-1"></i> ${hw.location || 'Unassigned'}</span>
                    <span><i class="fa-solid fa-power-off me-1"></i> ${hw.os || 'Unknown OS'}</span>
                </div>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-primary" onclick="editHardware(${index})"><i class="fa-solid fa-pen me-2"></i>Edit</button>
                <button class="btn btn-outline-danger" onclick="deleteHardware(${index})"><i class="fa-solid fa-trash me-2"></i>Delete</button>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-lg-6">
                <div class="glass-card h-100">
                    <h5 class="mb-3 border-bottom pb-2 border-secondary" style="border-color: rgba(255,255,255,0.1)!important;"><i class="fa-solid fa-microchip me-2"></i>Performance Specs</h5>
                    
                    <!-- Server/NAS Specs -->
                    <div class="spec-item" style="display: ${['server','nas','other', undefined].includes(hw.type) ? 'flex' : 'none'}">
                        <span class="spec-label">CPU Model</span>
                        <span class="spec-value">${hw.cpu || '-'}</span>
                    </div>
                    <div class="spec-item" style="display: ${['server','nas','other', undefined].includes(hw.type) ? 'flex' : 'none'}">
                        <span class="spec-label">Memory (RAM)</span>
                        <span class="spec-value">${hw.ram || '-'}</span>
                    </div>
                    <div class="spec-item" style="display: ${['server','nas','other', undefined].includes(hw.type) ? 'flex' : 'none'}">
                        <span class="spec-label">Primary Storage</span>
                        <span class="spec-value">${hw.storage || '-'}</span>
                    </div>
                        <div class="spec-item" style="display: ${['server','other', undefined].includes(hw.type) ? 'flex' : 'none'}">
                        <span class="spec-label">Graphics (GPU)</span>
                        <span class="spec-value">${hw.gpu || '-'}</span>
                    </div>

                    <!-- Network Specs -->
                    <div class="spec-item" style="display: ${['switch','nas'].includes(hw.type) ? 'flex' : 'none'}">
                        <span class="spec-label">Port Count</span>
                        <span class="spec-value">${hw.ports || '-'}</span>
                    </div>
                    <div class="spec-item" style="display: ${['switch','ap'].includes(hw.type) ? 'flex' : 'none'}">
                        <span class="spec-label">Speed / Standard</span>
                        <span class="spec-value">${hw.speed || '-'}</span>
                    </div>

                    <!-- Power Specs -->
                    <div class="spec-item" style="display: ${hw.type === 'ups' ? 'flex' : 'none'}">
                        <span class="spec-label">VA Rating</span>
                        <span class="spec-value">${hw.va_rating || '-'}</span>
                    </div>
                </div>
            </div>

            <div class="col-lg-6">
                <div class="glass-card h-100">
                    <h5 class="mb-3 border-bottom pb-2 border-secondary" style="border-color: rgba(255,255,255,0.1)!important;"><i class="fa-solid fa-network-wired me-2"></i>Network & Environment</h5>
                    <div class="spec-item">
                        <span class="spec-label">IP Address</span>
                        <span class="spec-value fw-mono text-info">${hw.ip || '-'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Power Draw</span>
                        <span class="spec-value text-warning">${hw.power || '-'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Operating System</span>
                        <span class="spec-value">${hw.os || '-'}</span>
                    </div>
                    <div class="mt-3 pt-2">
                        <div class="spec-label mb-2">Network Interfaces</div>
                        <div>${nicBadges}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showView('hardware-details');
}

// --- CRUD Logic ---
function saveLocation(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const val = fd.get('location_name').trim();
    const idx = fd.get('edit_index');
    
    if(!val) return;
    
    // Check duplicate
    if(locations.some((l, i) => l === val && (idx === '' || parseInt(idx) !== i))) {
        alert('Location exists'); return;
    }

    if(idx !== '') {
        const old = locations[idx];
        locations[idx] = val;
        hardware.forEach(h => { if(h.location === old) h.location = val; });
    } else {
        locations.push(val);
    }
    
    saveToLocalStorage();
    renderLocationsList();
    renderHardwareList();
    showView('locations');
    e.target.reset();
}

function saveHardware(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const idx = fd.get('edit_index');
    const obj = {};
    
    for(let [k,v] of fd.entries()) {
        if(k==='edit_index') continue;
        if(k==='nics[]') {
            if(!obj.nics) obj.nics = [];
            if(v.trim()) obj.nics.push(v.trim());
        } else {
            obj[k] = v.trim();
        }
    }

    if(idx !== '') {
        hardware[parseInt(idx)] = obj;
        saveToLocalStorage();
        // If we were editing from detail view, go back to detail view
        if(document.getElementById('hardware-detail-view').style.display === 'block') {
            viewHardwareDetail(parseInt(idx));
            return;
        }
    } else {
        hardware.push(obj);
    }
    
    saveToLocalStorage();
    renderHardwareList();
    renderLocationsList();
    showView('hardware');
    e.target.reset();
}

function saveService(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const idx = fd.get('edit_index');
    const obj = {};
    
    for(let [k,v] of fd.entries()) {
        if(k==='edit_index') continue;
        obj[k] = v.trim();
    }

    if(idx !== '') {
        services[parseInt(idx)] = obj;
    } else {
        services.push(obj);
    }
    
    saveToLocalStorage();
    renderServicesList();
    renderHardwareList(); // Re-render hardware to update counts
    showView('services');
    e.target.reset();
}

function saveConnection(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const obj = {};
    
    for(let [k,v] of fd.entries()) {
        if(k==='edit_index') continue;
        obj[k] = v.trim();
    }
    
    if(obj.source_device === obj.target_device && obj.source_port === obj.target_port) {
        alert("Source and Target cannot be identical."); return;
    }

    connections.push(obj);
    
    saveToLocalStorage();
    renderConnectionsList();
    showView('connections');
    e.target.reset();
    // Reset dropdowns
    document.getElementById('conn-source-port').innerHTML = '<option value="">Select Device First...</option>';
    document.getElementById('conn-target-port').innerHTML = '<option value="">Select Device First...</option>';
}

function deleteConnection(idx) {
    if(confirm('Delete this connection?')) {
        connections.splice(idx, 1);
        saveToLocalStorage();
        renderConnectionsList();
    }
}

function editLocation(idx) {
    document.getElementById('location-form-title').textContent = 'Edit Location';
    document.querySelector('[name="location_name"]').value = locations[idx];
    document.getElementById('location-edit-index').value = idx;
    showView('add-location');
}

function addHardware() {
    document.getElementById('hardware-form-title').textContent = 'Add Hardware';
    document.querySelector('#add-hardware-view form').reset();
    document.getElementById('hardware-edit-index').value = '';
    updateLocationDropdown();
    
    // Reset to default type view
    const typeSelect = document.querySelector('[name="type"]');
    typeSelect.value = '';
    updateFormFields();
    
    // Reset NICs
    document.getElementById('nics-section').innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" name="nics[]" placeholder="e.g., Intel X520-DA2">
            <button type="button" class="btn btn-outline-danger" onclick="removeField(this)">-</button>
        </div>
    `;

    showView('add-hardware');
}

function editHardware(idx) {
    const h = hardware[idx];
    document.getElementById('hardware-form-title').textContent = 'Edit Hardware';
    document.getElementById('hardware-edit-index').value = idx;
    updateLocationDropdown();
    
    // Set Type first to trigger field updates
    const typeSelect = document.querySelector('[name="type"]');
    if(typeSelect) {
        typeSelect.value = h.type || 'server';
        updateFormFields(); // Update visibility based on type
    }

    // Fill fields
    const fields = ['hostname','role','cpu','ram','storage','gpu','ports','speed','va_rating','ip','power','os'];
    fields.forEach(f => {
        const el = document.querySelector(`[name="${f}"]`);
        if(el) el.value = h[f] || '';
    });
    
    // Location
    setTimeout(() => document.querySelector('[name="location"]').value = h.location || '', 0);
    
    // NICs
    const nicDiv = document.getElementById('nics-section');
    nicDiv.innerHTML = '';
    (h.nics && h.nics.length ? h.nics : ['']).forEach(n => {
        const d = document.createElement('div');
        d.className = 'input-group mb-2';
        d.innerHTML = `<input type="text" class="form-control" name="nics[]" value="${n}"><button type="button" class="btn btn-outline-danger" onclick="removeField(this)">-</button>`;
        nicDiv.appendChild(d);
    });

    showView('add-hardware');
}

function editService(idx) {
    const s = services[idx];
    document.getElementById('service-form-title').textContent = 'Edit Service';
    document.getElementById('service-edit-index').value = idx;
    updateHostDropdown();

    // Fill fields
    const fields = ['type', 'name', 'url', 'description'];
    fields.forEach(f => {
        const el = document.querySelector(`#add-service-view [name="${f}"]`);
        if(el) el.value = s[f] || '';
    });

    // Host
        setTimeout(() => document.getElementById('service-host-select').value = s.host || '', 0);

    showView('add-service');
}

function deleteLocation(idx) {
    if(confirm('Delete this location?')) {
        locations.splice(idx, 1);
        saveToLocalStorage();
        renderLocationsList();
    }
}

function deleteHardware(idx) {
    if(confirm('Delete this node?')) {
        hardware.splice(idx, 1);
        saveToLocalStorage();
        renderHardwareList();
        renderLocationsList();
        showView('hardware');
    }
}

function deleteService(idx) {
    if(confirm('Delete this service?')) {
        services.splice(idx, 1);
        saveToLocalStorage();
        renderServicesList();
        renderHardwareList();
    }
}

function updateFormFields() {
    const type = document.getElementById('hw-type-select').value;
    const specs = document.querySelectorAll('.spec-field');
    
    // Define what fields to show for each type
    let show = []; // Default is empty (hidden)
    
    if (type === 'server') {
        show = ['cpu', 'ram', 'storage', 'gpu'];
    } else if (type === 'switch') {
        show = ['ports', 'speed'];
    } else if (type === 'ap') {
        show = ['speed'];
    } else if (type === 'nas') {
        show = ['cpu', 'ram', 'storage', 'ports'];
    } else if (type === 'ups') {
        show = ['va_rating'];
    } else if (type === 'iot' || type === 'camera') {
        show = []; // Only core fields (hostname, role, IP)
    } else if (type === 'other') {
            show = ['cpu', 'ram', 'storage', 'gpu']; // Show all for 'other' just in case
    }

    specs.forEach(el => {
        const spec = el.getAttribute('data-spec');
        if (show.includes(spec)) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
}

// --- Utilities ---
function updateLocationDropdown() {
    const s = document.getElementById('location-select');
    s.innerHTML = '<option value="">Select Location</option>' + locations.map(l => `<option value="${l}">${l}</option>`).join('');
}

function updateHostDropdown() {
    const s = document.getElementById('service-host-select');
    const hwOpts = hardware.map(h => `<option value="${h.hostname}">${h.hostname}</option>`).join('');
    
    // Filter services that can be hosts (VMs, LXCs) - exclude current service if editing
    const currentEditIdx = document.getElementById('service-edit-index').value;
    const currentSvcName = currentEditIdx !== '' ? services[currentEditIdx].name : null;
    
    const svcOpts = services
        .filter(svc => ['vm', 'lxc'].includes(svc.type) && svc.name !== currentSvcName)
        .map(svc => `<option value="${svc.name}">${svc.name} (${svc.type.toUpperCase()})</option>`)
        .join('');

    s.innerHTML = `
        <option value="">Select Host...</option>
        <optgroup label="Physical Hardware">
            ${hwOpts}
        </optgroup>
        ${svcOpts ? `<optgroup label="Virtual Hosts">
            ${svcOpts}
        </optgroup>` : ''}
    `;
}

function updateDeviceDropdowns() {
    const src = document.getElementById('conn-source-dev');
    const tgt = document.getElementById('conn-target-dev');
    
    const hwOpts = hardware.map(h => `<option value="${h.hostname}">${h.hostname}</option>`).join('');

    const opts = `
        <option value="">Select Device...</option>
        <optgroup label="Physical Hardware">
            ${hwOpts}
        </optgroup>
    `;
    
    // Preserve selection if just updating options
    const srcVal = src.value;
    const tgtVal = tgt.value;
    
    src.innerHTML = opts;
    tgt.innerHTML = opts;
    
    if(srcVal) src.value = srcVal;
    if(tgtVal) tgt.value = tgtVal;
}

function updatePortDropdown(side) {
    const devName = document.getElementById(`conn-${side}-dev`).value;
    const portSelect = document.getElementById(`conn-${side}-port`);
    
    portSelect.innerHTML = '<option value="">Select Port...</option>';
    
    if(!devName) {
        portSelect.innerHTML = '<option value="">Select Device First...</option>';
        return;
    }

    // Find device in hardware
    const hw = hardware.find(h => h.hostname === devName);

    if (hw) {
        // Add defined NICs
        if (hw.nics && hw.nics.length) {
            portSelect.innerHTML += `<optgroup label="Network Interfaces">${hw.nics.map(n => `<option value="${n}">${n}</option>`).join('')}</optgroup>`;
        }
        // Add generic ports if it's a switch
        if (hw.type === 'switch' && hw.ports) {
            const count = parseInt(hw.ports) || 0;
            let opts = '';
            for(let i=1; i<=count; i++) opts += `<option value="Port ${i}">Port ${i}</option>`;
            portSelect.innerHTML += `<optgroup label="Switch Ports">${opts}</optgroup>`;
        }
        // Add generic mgmt/power ports
        portSelect.innerHTML += `<optgroup label="Management">
            <option value="IPMI/iDRAC">IPMI/iDRAC</option>
            <option value="Power Input">Power Input</option>
        </optgroup>`;
    }
}

function addNicField() {
    const d = document.createElement('div');
    d.className = 'input-group mb-2';
    d.innerHTML = `<input type="text" class="form-control" name="nics[]"><button type="button" class="btn btn-outline-danger" onclick="removeField(this)">-</button>`;
    document.getElementById('nics-section').appendChild(d);
}
function removeField(btn) {
    if(document.getElementById('nics-section').children.length > 1) btn.parentElement.remove();
    else btn.previousElementSibling.value = '';
}

// --- File IO ---
function saveConfiguration() {
    const data = JSON.stringify({locations, hardware, services, connections, date: new Date()}, null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `homelab_config_${Date.now()}.json`;
    a.click();
}

function clearData() {
    if(confirm("Are you sure you want to clear ALL data? This action cannot be undone.")) {
        localStorage.removeItem(AUTO_SAVE_KEY);
        locations.length = 0;
        hardware.length = 0;
        services.length = 0;
        connections.length = 0;
        renderLocationsList();
        renderHardwareList();
        renderServicesList();
        renderConnectionsList();
        showView('overview');
    }
}

function loadConfiguration(e) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const d = JSON.parse(ev.target.result);
            if(d.locations) locations.splice(0, locations.length, ...d.locations);
            if(d.hardware) hardware.splice(0, hardware.length, ...d.hardware);
            if(d.services) services.splice(0, services.length, ...d.services);
            if(d.connections) connections.splice(0, connections.length, ...d.connections);
            saveToLocalStorage();
            renderLocationsList(); renderHardwareList(); renderServicesList(); renderConnectionsList(); showView('locations');
        } catch(err) { console.error(err); alert('Invalid File'); }
    };
    if(e.target.files[0]) reader.readAsText(e.target.files[0]);
    e.target.value = '';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Load auto-saved configuration on startup
    loadFromLocalStorage();
    
    renderLocationsList();
    renderHardwareList();
    renderServicesList();
    renderConnectionsList();
    showView('overview');
});

// --- Draw.io Export Logic ---

function getServiceIcon(name) {
    if (!name) return "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/server.png";
    
    // Normalization
    const n = name.toLowerCase().replace(/ /g, "").replace(/-/g, "");
    
    // Manual overrides
    const overrides = {
        // Infrastructure / OS
        "proxmox": "proxmox",
        "proxmoxve": "proxmox",
        "pve": "proxmox",
        "esxi": "vmware",
        "vmware": "vmware",
        "unraid": "unraid",
        "truenas": "truenas",
        "truenasscale": "truenas",
        "truenascore": "truenas",
        "openmediavault": "openmediavault",
        "omv": "openmediavault",
        "ubuntu": "ubuntu",
        "debian": "debian",
        "linux": "linux",
        "windows": "windows",
        "synology": "synology",
        "qnap": "qnap",
        "raspbian": "raspberry-pi",
        "raspberrypi": "raspberry-pi",
        
        // Networking
        "pfsense": "pfsense",
        "opnsense": "opnsense",
        "openwrt": "openwrt",
        "mikrotik": "mikrotik",
        "unifi": "unifi",
        "ubiquiti": "ubiquiti",
        "omada": "omada",
        "tp-link": "tp-link",
        "pihole": "pi-hole",
        "adguard": "adguard-home",
        "adguardhome": "adguard-home",
        "technitium": "technitium",
        "bind": "bind",
        "unbound": "unbound",
        "wireguard": "wireguard",
        "tailscale": "tailscale",
        "headscale": "headscale",
        "cloudflared": "cloudflare",
        "cloudflare": "cloudflare",

        // Containers / Orchestration
        "docker": "docker",
        "portainer": "portainer",
        "kubernetes": "kubernetes",
        "k8s": "kubernetes",
        "rancher": "rancher",
        
        // Proxy / Web Server
        "nginx": "nginx",
        "nginxproxymanager": "nginx-proxy-manager",
        "npm": "nginx-proxy-manager",
        "traefik": "traefik",
        "caddy": "caddy",
        "apache": "apache",
        "haproxy": "haproxy",
        
        // Media
        "plex": "plex",
        "jellyfin": "jellyfin",
        "emby": "emby",
        "tautulli": "tautulli",
        "ombi": "ombi",
        "overseerr": "overseerr",
        "jellyseerr": "jellyseerr",
        "sonarr": "sonarr",
        "radarr": "radarr",
        "lidarr": "lidarr",
        "readarr": "readarr",
        "prowlarr": "prowlarr",
        "bazarr": "bazarr",
        "jackett": "jackett",
        "sabnzbd": "sabnzbd",
        "nzbget": "nzbget",
        "qbittorrent": "qbittorrent",
        "transmission": "transmission",
        "deluge": "deluge",
        "rtorrent": "rtorrent",
        "flood": "flood",
        "navidrome": "navidrome",
        "audiobookshelf": "audiobookshelf",
        "audiobook": "audiobookshelf",
        
        // Home Automation
        "homeassistant": "home-assistant",
        "hass": "home-assistant",
        "openhab": "openhab",
        "domoticz": "domoticz",
        "homebridge": "homebridge",
        "zigbee": "zigbee2mqtt",
        "zigbee2mqtt": "zigbee2mqtt",
        "z2m": "zigbee2mqtt",
        "nodered": "node-red",
        "mqtt": "mqtt",
        "mosquitto": "mosquitto",
        "esphome": "esphome",
        "frigate": "frigate",
        
        // Monitoring / Dashboard
        "grafana": "grafana",
        "prometheus": "prometheus",
        "influxdb": "influxdb",
        "telegraf": "telegraf",
        "zabbix": "zabbix",
        "uptimekuma": "uptime-kuma",
        "kuma": "uptime-kuma",
        "homepage": "homepage",
        "dashy": "dashy",
        "homarr": "homarr",
        "heimdall": "heimdall",
        "organizr": "organizr",
        "glances": "glances",
        "netdata": "netdata",
        "beszel": "beszel",
        
        // Productivity / Tools
        "nextcloud": "nextcloud",
        "owncloud": "owncloud",
        "syncthing": "syncthing",
        "paperless": "paperless-ngx",
        "paperlessngx": "paperless-ngx",
        "paperlessng": "paperless-ng",
        "immich": "immich",
        "photoprism": "photoprism",
        "vaultwarden": "vaultwarden",
        "bitwarden": "bitwarden",
        "searxng": "searxng",
        "whoogle": "whoogle",
        "joplin": "joplin",
        "obsidian": "obsidian",
        "bookstack": "bookstack",
        "wiki": "wikipedia",
        "wikijs": "wiki-js",
        
        // Auth / Security
        "authelia": "authelia",
        "authentik": "authentik",
        "keycloak": "keycloak",
        "fail2ban": "fail2ban",
        "crowdsec": "crowdsec",
        
        // Development
        "gitea": "gitea",
        "gitlab": "gitlab",
        "github": "github",
        "jenkins": "jenkins",
        "vscode": "visual-studio-code",
        "code-server": "code-server",
        
        // Databases
        "mysql": "mysql",
        "mariadb": "mariadb",
        "postgres": "postgresql",
        "postgresql": "postgresql",
        "redis": "redis",
        "mongodb": "mongodb",
        "sqlite": "sqlite",
        
        // Generic / Custom Mappings
        "mainvm": "linux",
        "lab": "linux",
    };
    
    const slug = overrides[n] || n;
    return `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${slug}.png`;
}

function createMxCell(doc, id, value, style, parent, x, y, width, height, vertex="1") {
    const cell = doc.createElement("mxCell");
    cell.setAttribute("id", String(id));
    cell.setAttribute("value", value);
    cell.setAttribute("style", style);
    cell.setAttribute("vertex", vertex);
    cell.setAttribute("parent", String(parent));
    
    const geometry = doc.createElement("mxGeometry");
    geometry.setAttribute("x", String(x));
    geometry.setAttribute("y", String(y));
    geometry.setAttribute("width", String(width));
    geometry.setAttribute("height", String(height));
    geometry.setAttribute("as", "geometry");
    
    cell.appendChild(geometry);
    return cell;
}

function createEdge(doc, id, value, source, target, parent="1") {
    const edge = doc.createElement("mxCell");
    edge.setAttribute("id", String(id));
    edge.setAttribute("value", value);
    edge.setAttribute("style", "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;strokeColor=#555555;");
    edge.setAttribute("edge", "1");
    edge.setAttribute("parent", String(parent));
    edge.setAttribute("source", String(source));
    edge.setAttribute("target", String(target));
    
    const geometry = doc.createElement("mxGeometry");
    geometry.setAttribute("relative", "1");
    geometry.setAttribute("as", "geometry");
    
    edge.appendChild(geometry);
    return edge;
}

function downloadDrawioXML() {
    // Use the global state variables: hardware, services, connections
    
    // Create XML Document
    const doc = document.implementation.createDocument(null, "mxfile", null);
    const mxfile = doc.documentElement;
    mxfile.setAttribute("host", "Electron");
    mxfile.setAttribute("modified", new Date().toISOString());
    mxfile.setAttribute("agent", "LabMapper");
    mxfile.setAttribute("version", "21.0.0");
    mxfile.setAttribute("type", "device");
    
    const diagram = doc.createElement("diagram");
    diagram.setAttribute("id", "homelab-diagram");
    diagram.setAttribute("name", "Homelab Architecture");
    mxfile.appendChild(diagram);
    
    const mxGraphModel = doc.createElement("mxGraphModel");
    mxGraphModel.setAttribute("dx", "1422");
    mxGraphModel.setAttribute("dy", "794");
    mxGraphModel.setAttribute("grid", "1");
    mxGraphModel.setAttribute("gridSize", "10");
    mxGraphModel.setAttribute("guides", "1");
    mxGraphModel.setAttribute("tooltips", "1");
    mxGraphModel.setAttribute("connect", "1");
    mxGraphModel.setAttribute("arrows", "1");
    mxGraphModel.setAttribute("fold", "1");
    mxGraphModel.setAttribute("page", "1");
    mxGraphModel.setAttribute("pageScale", "1");
    mxGraphModel.setAttribute("pageWidth", "850");
    mxGraphModel.setAttribute("pageHeight", "1100");
    mxGraphModel.setAttribute("math", "0");
    mxGraphModel.setAttribute("shadow", "0");
    diagram.appendChild(mxGraphModel);
    
    const root = doc.createElement("root");
    mxGraphModel.appendChild(root);
    
    // Default layers
    const layer0 = doc.createElement("mxCell");
    layer0.setAttribute("id", "0");
    root.appendChild(layer0);
    
    const layer1 = doc.createElement("mxCell");
    layer1.setAttribute("id", "1");
    layer1.setAttribute("parent", "0");
    root.appendChild(layer1);
    
    let curr_id = 2;

    // --- STYLES ---
    const STYLE_HOST = "group;rounded=1;whiteSpace=wrap;html=1;fillColor=#F1F8E9;strokeColor=#81C784;strokeWidth=2;arcSize=6;fontColor=#000000;";
    const STYLE_VM = "group;rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#64B5F6;strokeWidth=2;arcSize=10;fontColor=#000000;";
    const STYLE_PORT = "rounded=0;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=10;align=center;verticalAlign=middle;";
    const STYLE_ICON = "shape=image;verticalLabelPosition=bottom;verticalAlign=top;imageAspect=1;aspect=fixed;";
    const STYLE_TEXT_CENTER = "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;";
    const STYLE_TEXT_LEFT = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;";

    // --- LAYOUT CONSTANTS ---
    const HOST_WIDTH = 600;
    const VM_WIDTH = 500;
    const SERVICE_GRID_COLS = 3;
    const SERVICE_CELL_WIDTH = 160;
    const SERVICE_CELL_HEIGHT = 140;
    const PADDING = 20;
    
    const ICON_SERVER = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/proxmox.png";
    const ICON_SWITCH = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/tp-link.png";
    const ICON_ROUTER = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/router.png";
    const ICON_WIFI = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/unifi.png";
    const ICON_NAS = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/truenas.png";
    const ICON_RACK = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/proxmox.png";
    const ICON_CAMERA = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/frigate.png";
    const ICON_UPS = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/nut.png";

    // --- ORDERING LOGIC (BFS/Adjacency) ---
    const adj = {};
    connections.forEach(conn => {
        const u = conn.source_device;
        const v = conn.target_device;
        if(u && v) {
            if(!adj[u]) adj[u] = [];
            if(!adj[v]) adj[v] = [];
            adj[u].push(v);
            adj[v].push(u);
        }
    });
    
    let start_node = null;
    for(let h of hardware) {
        const name = (h.hostname || '').toLowerCase();
        if(name.includes('modem') || name.includes('isp') || name.includes('wan')) {
            start_node = h.hostname;
            break;
        }
    }
    if(!start_node && hardware.length > 0) {
        start_node = hardware[0].hostname;
    }
    
    const visited = new Set();
    const ordered_hostnames = [];
    const queue = start_node ? [start_node] : [];
    
    while(queue.length > 0) {
        const u = queue.shift();
        if(!visited.has(u)) {
            visited.add(u);
            ordered_hostnames.push(u);
            if(adj[u]) {
                adj[u].forEach(v => {
                    if(!visited.has(v)) queue.push(v);
                });
            }
        }
    }
    
    hardware.forEach(h => {
        if(!visited.has(h.hostname)) {
            ordered_hostnames.push(h.hostname);
            visited.add(h.hostname);
        }
    });
    
    const hardware_map = {};
    hardware.forEach(h => hardware_map[h.hostname] = h);
    
    // Create a set of known service/VM names to prevent creating hardware nodes for them
    // This ensures VMs (which are services) don't get created as standalone hardware
    const knownServiceNames = new Set(services.map(s => s.name));

    // Ensure phantom nodes (referenced but not defined) are included
    // But ONLY if they are not known services/VMs
    ordered_hostnames.forEach(hn => {
        if (!hardware_map[hn] && !knownServiceNames.has(hn)) {
            // Create a default entry for phantom nodes
            hardware_map[hn] = {
                hostname: hn,
                type: 'server', // Default assumption
                role: 'Detected Node',
                location: 'Unknown',
                is_phantom: true
            };
        }
    });

    // Check for services that have hosts not yet in the map
    services.forEach(s => {
        if(s.host && !hardware_map[s.host] && !knownServiceNames.has(s.host)) {
             hardware_map[s.host] = {
                hostname: s.host,
                type: 'server',
                role: 'Service Host',
                location: 'Unknown',
                is_phantom: true
            };
            if (!ordered_hostnames.includes(s.host)) {
                ordered_hostnames.push(s.host);
            }
        }
    });

    const ordered_hardware = ordered_hostnames
        .map(hn => hardware_map[hn]);
        
    let current_y = 40;
    const host_id_map = {};
    const host_port_map = {}; // hostname -> {port_name: port_id}
    
    ordered_hardware.forEach(hw => {
        const hostname = hw.hostname;
        host_port_map[hostname] = {};
        
        const host_id = curr_id++;
        host_id_map[hostname] = host_id;
        
        const host_cell = createMxCell(doc, host_id, "", STYLE_HOST, "1", 40, current_y, HOST_WIDTH, 200);
        root.appendChild(host_cell);
        
        // Determine Icon
        const hw_type = (hw.type || 'server').toLowerCase();
        let hw_icon = ICON_SERVER;
        if(hw_type.includes('switch')) hw_icon = ICON_SWITCH;
        else if(hw_type.includes('router') || hw_type.includes('modem')) hw_icon = ICON_ROUTER;
        else if(hw_type.includes('nas') || hw_type.includes('storage')) hw_icon = ICON_NAS;
        else if(hw_type.includes('rack')) hw_icon = ICON_RACK;
        else if(hw_type.includes('camera')) hw_icon = ICON_CAMERA;
        else if(hw_type.includes('ap') || hw_type.includes('wifi')) hw_icon = ICON_WIFI;
        else if(hw_type.includes('ups')) hw_icon = ICON_UPS;
        
        root.appendChild(createMxCell(doc, curr_id++, "", `${STYLE_ICON}image=${hw_icon}`, host_id, 20, 20, 64, 64));
        
        // Only show OS icon if it's not Proxmox (avoid redundancy with main icon)
        if(hw.os && !hw.os.toLowerCase().includes('proxmox') && !hw.os.toLowerCase().includes('pve')) {
            const os_icon = getServiceIcon(hw.os);
            root.appendChild(createMxCell(doc, curr_id++, "", `${STYLE_ICON}image=${os_icon}`, host_id, HOST_WIDTH - 84, 20, 48, 48));
        }
        
        // Specs Label
        let specs = [`<div style='font-size:18px; font-weight:bold; margin-bottom:5px'>${hostname}</div>`];
        
        const location_role = [];
        if(hw.location) location_role.push(`🌐 ${hw.location}`);
        if(hw.role) location_role.push(`⚙️ ${hw.role}`);
        if(location_role.length) specs.push(`<div style='font-size:11px; color:#666; margin-bottom:5px'>${location_role.join(' | ')}</div>`);
        
        if(hw.ip) specs.push(`<div style='font-size:12px; color:#333; margin-bottom:8px'>${hw.ip}</div>`);
        
        const host_specs_list = [];
        if(hw.cpu) host_specs_list.push(`CPU: ${hw.cpu}`);
        if(hw.ram) host_specs_list.push(`RAM: ${hw.ram}`);
        if(hw.storage) host_specs_list.push(`Disk: ${hw.storage}`);
        if(hw.gpu) host_specs_list.push(`GPU: ${hw.gpu}`);
        if(hw.ports) host_specs_list.push(`Ports: ${hw.ports}`);
        if(hw.power) host_specs_list.push(`Power: ${hw.power}W`);
        if(hw.speed) host_specs_list.push(`Speed: ${hw.speed}`);
        if(hw.va_rating) host_specs_list.push(`VA: ${hw.va_rating}`);
        
        if(host_specs_list.length) {
            specs.push("<div style='font-size:11px; color:#555; line-height:1.4'>");
            host_specs_list.forEach(s => specs.push(`${s}<br>`));
            specs.push("</div>");
        }
        
        root.appendChild(createMxCell(doc, curr_id++, specs.join(""), STYLE_TEXT_CENTER, host_id, 100, 10, HOST_WIDTH - 200, 120));
        
        // Services & VMs
        // Robust matching: Case-insensitive and trim
        const normalize = (s) => (s || '').toLowerCase().trim();
        const targetHost = normalize(hostname);
        
        const host_services = services.filter(s => normalize(s.host) === targetHost);
        const vms = host_services.filter(s => s.type === 'vm' || s.type === 'lxc');
        const direct_containers = host_services.filter(s => s.type === 'docker' || s.type === 'service');
        
        console.log(`Processing Host: ${hostname} (Normalized: ${targetHost})`);
        console.log(`  - Found ${host_services.length} services/vms directly on this host`);
        console.log(`  - VMs: ${vms.map(v => v.name).join(', ')}`);
        console.log(`  - Direct Containers: ${direct_containers.map(c => c.name).join(', ')}`);

        let content_y = 140;
        
        vms.forEach(vm => {
            const vm_id = curr_id++;
            const vm_label = `<div style='font-size:15px; font-weight:bold; color:#000'>${vm.name}</div>` +
                             (vm.url ? `<div style='font-size:13px; color:#D32F2F; font-weight:bold; font-family:monospace; margin-top:2px'>${vm.url}</div>` : '');
            
            const vm_cell = createMxCell(doc, vm_id, "", STYLE_VM, host_id, (HOST_WIDTH - VM_WIDTH) / 2, content_y, VM_WIDTH, 100);
            root.appendChild(vm_cell);
            
            // VM Icon
            const vm_os_icon = getServiceIcon("linux");
            root.appendChild(createMxCell(doc, curr_id++, "", `${STYLE_ICON}image=${vm_os_icon}`, vm_id, 20, 15, 32, 32));
            
            // VM Text
            root.appendChild(createMxCell(doc, curr_id++, vm_label, STYLE_TEXT_LEFT, vm_id, 60, 10, 300, 50));
            
            // Containers inside VM
            const targetVmName = normalize(vm.name);
            const vm_conts = services.filter(s => normalize(s.host) === targetVmName);
            
            console.log(`  - VM: ${vm.name} (Normalized: ${targetVmName}) has ${vm_conts.length} containers`);

            let grid_start_y = 70;
            let current_row = 0;
            let current_col = 0;
            
            vm_conts.forEach(cont => {
                const cont_icon = getServiceIcon(cont.name);
                const cell_x = PADDING + current_col * SERVICE_CELL_WIDTH;
                const cell_y = grid_start_y + current_row * SERVICE_CELL_HEIGHT;
                
                const icon_x = cell_x + (SERVICE_CELL_WIDTH - 48) / 2;
                root.appendChild(createMxCell(doc, curr_id++, "", `${STYLE_ICON}image=${cont_icon}`, vm_id, icon_x, cell_y, 48, 48));
                
                let details = [`<b>${cont.name}</b>`];
                if(cont.url) details.push(`<a href='${cont.url}' style='color:#0066CC; text-decoration:underline; font-size:11px'>${cont.url}</a>`);
                if(cont.description) details.push(`<i style='font-size:10px; color:#666'>${cont.description}</i>`);
                
                root.appendChild(createMxCell(doc, curr_id++, details.join("<br>"), STYLE_TEXT_CENTER, vm_id, cell_x, cell_y + 50, SERVICE_CELL_WIDTH, 80));
                
                current_col++;
                if(current_col >= SERVICE_GRID_COLS) {
                    current_col = 0;
                    current_row++;
                }
            });
            
            let rows = current_row + (current_col > 0 ? 1 : 0);
            rows = Math.max(1, rows);
            const vm_height = grid_start_y + rows * SERVICE_CELL_HEIGHT + 20;
            
            // Update VM Height
            vm_cell.getElementsByTagName("mxGeometry")[0].setAttribute("height", String(vm_height));
            content_y += vm_height + PADDING;
        });
        
        if(direct_containers.length > 0) {
            root.appendChild(createMxCell(doc, curr_id++, "Direct Services", STYLE_TEXT_LEFT, host_id, (HOST_WIDTH - VM_WIDTH) / 2, content_y, 200, 30));
            content_y += 30;
            
            const dc_id = curr_id++;
            const dc_cell = createMxCell(doc, dc_id, "", STYLE_VM, host_id, (HOST_WIDTH - VM_WIDTH) / 2, content_y, VM_WIDTH, 100);
            root.appendChild(dc_cell);
            
            let grid_start_y = 20;
            let current_row = 0;
            let current_col = 0;
            
            direct_containers.forEach(cont => {
                const cont_icon = getServiceIcon(cont.name);
                const cell_x = PADDING + current_col * SERVICE_CELL_WIDTH;
                const cell_y = grid_start_y + current_row * SERVICE_CELL_HEIGHT;
                
                const icon_x = cell_x + (SERVICE_CELL_WIDTH - 48) / 2;
                root.appendChild(createMxCell(doc, curr_id++, "", `${STYLE_ICON}image=${cont_icon}`, dc_id, icon_x, cell_y, 48, 48));
                
                let details = [`<b>${cont.name}</b>`];
                if(cont.url) details.push(`<a href='${cont.url}' style='color:#0066CC; text-decoration:underline; font-size:11px'>${cont.url}</a>`);
                if(cont.description) details.push(`<i style='font-size:10px; color:#666'>${cont.description}</i>`);
                
                root.appendChild(createMxCell(doc, curr_id++, details.join("<br>"), STYLE_TEXT_CENTER, dc_id, cell_x, cell_y + 50, SERVICE_CELL_WIDTH, 80));
                
                current_col++;
                if(current_col >= SERVICE_GRID_COLS) {
                    current_col = 0;
                    current_row++;
                }
            });
            
            let rows = current_row + (current_col > 0 ? 1 : 0);
            const dc_height = grid_start_y + rows * SERVICE_CELL_HEIGHT + 20;
            
            dc_cell.getElementsByTagName("mxGeometry")[0].setAttribute("height", String(dc_height));
            content_y += dc_height + PADDING;
        }
        
        // Render Physical Ports
        let ports = hw.nics || [];
        if(ports.length === 0 && hw.ports && !isNaN(hw.ports)) {
             const count = parseInt(hw.ports);
             for(let i = 1; i <= count; i++) ports.push(String(i));
        }
        
        if(ports.length > 0) {
            const port_size = 30;
            const port_spacing = 10;
            const port_start_y = content_y + 10;
            
            ports.forEach((port_name, i) => {
                const port_id = curr_id++;
                const p_x = 20 + i * (port_size + port_spacing);
                root.appendChild(createMxCell(doc, port_id, port_name, STYLE_PORT, host_id, p_x, port_start_y, port_size, port_size));
                host_port_map[hostname][port_name] = port_id;
            });
            
            content_y = port_start_y + port_size + 10;
        }
        
        const host_height = content_y + 20;
        host_cell.getElementsByTagName("mxGeometry")[0].setAttribute("height", String(host_height));
        
        current_y += host_height + 40;
    });
    
    // Connections
    connections.forEach(conn => {
        const src_dev = conn.source_device;
        const tgt_dev = conn.target_device;
        
        if(host_id_map[src_dev] && host_id_map[tgt_dev]) {
            let src_id = host_id_map[src_dev];
            const src_port_name = conn.source_port || '';
            if(src_port_name) {
                if(host_port_map[src_dev] && host_port_map[src_dev][src_port_name]) {
                    src_id = host_port_map[src_dev][src_port_name];
                } else {
                    const clean = src_port_name.replace("Port ", "").trim();
                    if(host_port_map[src_dev] && host_port_map[src_dev][clean]) {
                        src_id = host_port_map[src_dev][clean];
                    }
                }
            }
            
            let tgt_id = host_id_map[tgt_dev];
            const tgt_port_name = conn.target_port || '';
            if(tgt_port_name) {
                if(host_port_map[tgt_dev] && host_port_map[tgt_dev][tgt_port_name]) {
                    tgt_id = host_port_map[tgt_dev][tgt_port_name];
                } else {
                    const clean = tgt_port_name.replace("Port ", "").trim();
                    if(host_port_map[tgt_dev] && host_port_map[tgt_dev][clean]) {
                        tgt_id = host_port_map[tgt_dev][clean];
                    }
                }
            }
            
            let label = "";
            if(src_port_name || tgt_port_name) {
                label = `${src_port_name} --- ${tgt_port_name}`;
            }
            
            root.appendChild(createEdge(doc, curr_id++, label, src_id, tgt_id));
        }
    });
    
    // Serialize and Download
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(doc);
    
    const blob = new Blob([xmlString], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'homelab_architecture.drawio';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Draw.io XML generated and downloaded.");
}