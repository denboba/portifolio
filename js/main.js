document.addEventListener('DOMContentLoaded', () => {
    // Initialize window management
    initializeWindowManagement();

    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();

    // Initialize search functionality
    initializeSearch();

    // Initialize view controls
    initializeViewControls();

    // Initialize filter controls
    initializeFilterControls();

    // Initialize skill bars animation
    initializeSkillBars();

    // Initialize window snapping
    initializeWindowSnapping();

    // Initialize file downloads
    initializeFileDownloads();

    // Update taskbar clock
    updateClock();
    setInterval(updateClock, 1000);

    function initializeFileDownloads() {
        // Handle CV download
        document.querySelectorAll('.cv-btn, .desktop-icon[data-app="cv"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Would you like to download the CV?')) {
                    window.location.href = 'images/cv-template.pdf';
                    showToast('CV download started!');
                }
            });
        });

        // Handle README download
        document.querySelectorAll('.readme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Would you like to download the README file?')) {
                    window.location.href = 'README.md';
                    showToast('README download started!');
                }
            });
        });
    }

    function initializeKeyboardShortcuts() {
        let altTabActive = false;
        let activeWindowIndex = 0;
        const windows = document.querySelectorAll('.app-window');
        const windowsList = Array.from(windows);

        // Create window preview element
        const windowPreview = document.createElement('div');
        windowPreview.className = 'window-preview';
        document.body.appendChild(windowPreview);

        document.addEventListener('keydown', (e) => {
            // Alt + ` : Toggle terminal only if a terminal-triggering app is active
            if (e.altKey && e.key === '`') {
                e.preventDefault();
                const activeApp = document.querySelector('.app-window.active');
                const terminal = document.getElementById('terminal-window');
                if (activeApp && (activeApp.classList.contains('settings-window') || 
                    activeApp.classList.contains('profile-window'))) {
                    if (terminal.style.display === 'none') {
                        terminal.style.display = 'block';
                        terminal.classList.add('active');
                        focusWindow(terminal);
                        const terminalInput = terminal.querySelector('.terminal-input');
                        if (terminalInput) terminalInput.focus();
                    } else {
                        terminal.classList.add('minimized');
                        setTimeout(() => {
                            terminal.style.display = 'none';
                            terminal.classList.remove('minimized', 'active');
                        }, 300);
                    }
                }
            }

            // Alt + Tab : Cycle through windows
            if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
                if (!altTabActive) {
                    altTabActive = true;
                    showWindowPreview();
                }
                cycleWindows(e.shiftKey);
            }

            // Alt + F4 : Close active window
            if (e.altKey && e.key === 'F4') {
                e.preventDefault();
                const activeWindow = document.querySelector('.app-window.active');
                if (activeWindow) {
                    activeWindow.classList.remove('active');
                }
            }

            // Alt + Arrow Keys : Window snapping
            if (e.altKey && e.key.startsWith('Arrow')) {
                e.preventDefault();
                const activeWindow = document.querySelector('.app-window.active');
                if (activeWindow) {
                    switch (e.key) {
                        case 'ArrowLeft':
                            snapWindow(activeWindow, 'left');
                            break;
                        case 'ArrowRight':
                            snapWindow(activeWindow, 'right');
                            break;
                        case 'ArrowUp':
                            snapWindow(activeWindow, 'top');
                            break;
                        case 'ArrowDown':
                            snapWindow(activeWindow, 'bottom');
                            break;
                    }
                }
            }

            // Super Key : Toggle app launcher
            if (e.key === 'Meta') {
                e.preventDefault();
                document.querySelector('.app-launcher').classList.toggle('active');
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt' && altTabActive) {
                altTabActive = false;
                hideWindowPreview();
                focusSelectedWindow();
            }
        });

        function showWindowPreview() {
            windowPreview.innerHTML = '';
            windowsList.forEach((win, index) => {
                const title = win.querySelector('.window-title').textContent;
                const icon = win.querySelector('.window-title i').className;
                const item = document.createElement('div');
                item.className = `preview-item ${index === activeWindowIndex ? 'active' : ''}`;
                item.innerHTML = `
                    <i class="${icon}"></i>
                    <span>${title}</span>
                `;
                windowPreview.appendChild(item);
            });
            windowPreview.classList.add('visible');
        }

        function hideWindowPreview() {
            windowPreview.classList.remove('visible');
        }

        function cycleWindows(reverse = false) {
            if (reverse) {
                activeWindowIndex = (activeWindowIndex - 1 + windowsList.length) % windowsList.length;
            } else {
                activeWindowIndex = (activeWindowIndex + 1) % windowsList.length;
            }
            updateWindowPreview();
        }

        function updateWindowPreview() {
            const items = windowPreview.querySelectorAll('.preview-item');
            items.forEach((item, index) => {
                item.classList.toggle('active', index === activeWindowIndex);
            });
        }

        function focusSelectedWindow() {
            const selectedWindow = windowsList[activeWindowIndex];
            if (selectedWindow) {
                windowsList.forEach(win => win.classList.remove('active'));
                selectedWindow.classList.add('active');
                focusWindow(selectedWindow);
            }
        }
    }

    function initializeWindowSnapping() {
        const snapZones = {
            left: { guide: createSnapGuide('left'), threshold: 50 },
            right: { guide: createSnapGuide('right'), threshold: 50 },
            top: { guide: createSnapGuide('top'), threshold: 50 },
            bottom: { guide: createSnapGuide('bottom'), threshold: 50 }
        };

        function createSnapGuide(position) {
            const guide = document.createElement('div');
            guide.className = `snap-guide snap-guide-${position}`;
            document.body.appendChild(guide);
            return guide;
        }

        function showSnapGuide(position) {
            snapZones[position].guide.classList.add('visible');
        }

        function hideSnapGuides() {
            Object.values(snapZones).forEach(zone => {
                zone.guide.classList.remove('visible');
            });
        }

        function detectSnapZone(window, x, y) {
            const rect = window.getBoundingClientRect();
            const zones = [];

            if (x <= snapZones.left.threshold) zones.push('left');
            if (x >= window.innerWidth - rect.width - snapZones.right.threshold) zones.push('right');
            if (y <= snapZones.top.threshold + 28) zones.push('top');
            if (y >= window.innerHeight - rect.height - snapZones.bottom.threshold) zones.push('bottom');

            return zones[0]; // Return the first detected zone
        }

        document.addEventListener('dragstart', (e) => {
            if (e.target.closest('.window-header')) {
                const window = e.target.closest('.app-window');
                window.classList.add('dragging');
            }
        });

        document.addEventListener('drag', (e) => {
            if (e.target.closest('.window-header')) {
                const window = e.target.closest('.app-window');
                const snapZone = detectSnapZone(window, e.clientX, e.clientY);

                hideSnapGuides();
                if (snapZone) {
                    showSnapGuide(snapZone);
                }
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.closest('.window-header')) {
                const window = e.target.closest('.app-window');
                const snapZone = detectSnapZone(window, e.clientX, e.clientY);

                window.classList.remove('dragging');
                hideSnapGuides();

                if (snapZone) {
                    snapWindow(window, snapZone);
                }
            }
        });
    }

    function snapWindow(window, position) {
        // Remove all snap classes
        window.classList.remove('snap-left', 'snap-right', 'snap-top', 'snap-bottom');
        
        // Add the new snap class
        window.classList.add(`snap-${position}`);
        
        // Ensure the window is active
        focusWindow(window);
    }

    function focusWindow(window) {
        if (!window || window.style.display === 'none') return;
        
        const windows = document.querySelectorAll('.app-window');
        windows.forEach(w => {
            w.style.zIndex = w === window ? '100' : '1';
            w.classList.remove('active');
        });
        window.classList.add('active');
        
        // Update taskbar to reflect active window
        const taskbarApps = document.querySelectorAll('.taskbar-app');
        taskbarApps.forEach(app => {
            const appId = app.getAttribute('data-app');
            const appWindow = document.querySelector(`#${appId}-window`);
            app.classList.toggle('active', appWindow === window && window.style.display !== 'none');
        });
        
        // Ensure window is visible
        if (window.classList.contains('minimized')) {
            window.classList.remove('minimized');
            window.style.display = 'block';
        }
    }

    // Global window management state
    let activeWindow = null;
    let zIndex = 100;
    let dragState = {
        isDragging: false,
        initialX: 0,
        initialY: 0,
        initialOffsetX: 0,
        initialOffsetY: 0
    };

    function initializeWindowManagement() {
        // Initialize all windows and desktop icons
        const allWindows = Array.from(document.querySelectorAll('.app-window'));
        const allDesktopIcons = document.querySelectorAll('.desktop-icon');
        allDesktopIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                const appName = icon.getAttribute('data-app');
                const appWindow = document.querySelector(`#${appName}-window`);
                if (appWindow) {
                    // Show the app window with Ubuntu-style animation
                    appWindow.style.display = 'block';
                    appWindow.classList.add('active', 'opening');
                    focusWindow(appWindow);
                    
                    setTimeout(() => {
                        appWindow.classList.remove('opening');
                    }, 300);

                    // Special handling for settings app
                    if (appName === 'settings') {
                        const terminal = document.getElementById('terminal-window');
                        if (terminal) {
                            terminal.style.display = 'block';
                            terminal.classList.add('active', 'opening');
                            focusWindow(terminal);
                            
                            setTimeout(() => {
                                terminal.classList.remove('opening');
                            }, 300);

                            const terminalInput = terminal.querySelector('.terminal-input');
                            if (terminalInput) {
                                terminalInput.focus();
                                const welcomeMsg = 'Welcome to Ubuntu Settings\n' +
                                    'Type "help" to see available commands.\n' +
                                    '\nPopular commands:\n' +
                                    '- theme [light/dark]\n' +
                                    '- font [size]\n' +
                                    '- layout [grid/list]\n' +
                                    '- animations [on/off]';
                                const output = terminal.querySelector('.terminal-output');
                                if (output) {
                                    const block = createCommandBlock('', welcomeMsg);
                                    output.appendChild(block);
                                    block.scrollIntoView();
                                }
                            }
                        }
                    }
                } else if (appName === 'home') {
                    // Check if home window already exists
                    let homeWindow = document.getElementById('home-window');
                    
                    if (!homeWindow) {
                        // Create home window if it doesn't exist
                        homeWindow = document.createElement('div');
                        homeWindow.className = 'app-window file-manager-window';
                        homeWindow.id = 'home-window';
                        homeWindow.innerHTML = `
                            <div class="window-header">
                                <div class="window-title">
                                    <img src="images/ubuntu_folder/home.png" alt="Home">
                                    Home Folder
                                </div>
                                <div class="window-controls">
                                    <span class="control minimize"></span>
                                    <span class="control maximize"></span>
                                    <span class="control close"></span>
                                </div>
                            </div>
                            <div class="window-content">
                                <div class="file-manager-toolbar">
                                    <button class="nav-btn back"><i class="fas fa-arrow-left"></i></button>
                                    <button class="nav-btn forward"><i class="fas fa-arrow-right"></i></button>
                                    <button class="nav-btn up"><i class="fas fa-arrow-up"></i></button>
                                    <div class="path-bar">/home/user</div>
                                </div>
                                <div class="file-manager-content">
                                    <div class="folder-grid">
                                        <div class="folder-item" data-type="folder">
                                            <img src="images/ubuntu_folder/documents.png" alt="Documents">
                                            <span>Documents</span>
                                        </div>
                                        <div class="folder-item" data-type="folder">
                                            <img src="images/ubuntu_folder/downloads.png" alt="Downloads">
                                            <span>Downloads</span>
                                        </div>
                                        <div class="folder-item" data-type="folder">
                                            <img src="images/ubuntu_folder/pictures.png" alt="Pictures">
                                            <span>Pictures</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(homeWindow);
                        
                        // Initialize window management for the new window
                        const header = homeWindow.querySelector('.window-header');
                        makeWindowDraggable(homeWindow, header);
                        setupWindowControls(homeWindow);
                        setupWindowSnapping(homeWindow);
                    }
                    
                    // Show and focus the home window
                    if (homeWindow.style.display === 'none') {
                        homeWindow.style.display = 'block';
                        homeWindow.classList.add('active', 'opening');
                        setTimeout(() => homeWindow.classList.remove('opening'), 300);
                    }
                    focusWindow(homeWindow);
                    
                    // Update taskbar
                    const taskbarApp = document.querySelector('.taskbar-app[data-app="home"]');
                    if (taskbarApp) {
                        document.querySelectorAll('.taskbar-app').forEach(app => app.classList.remove('active'));
                        taskbarApp.classList.add('active');
                    }
                    const appWindows = document.querySelector('.app-windows');
                    if (appWindows) {
                        appWindows.appendChild(fileManager);
                    }
                    fileManager.style.display = 'block';
                    fileManager.classList.add('active', 'opening');
                    focusWindow(fileManager);
                    setTimeout(() => {
                        fileManager.classList.remove('opening');
                    }, 300);
                    
                    // Initialize window controls for the new window
                    setupWindowControls(fileManager);
                    makeWindowDraggable(fileManager, fileManager.querySelector('.window-header'));
                }
            });
        });

        document.querySelectorAll('.app-window').forEach(appWindow => {
            const header = appWindow.querySelector('.window-header');
            const controls = appWindow.querySelectorAll('.window-controls .control');

            // Make window draggable
            if (header) {
                header.addEventListener('mousedown', (e) => {
                    if (!e.target.closest('.control')) {
                        dragState.isDragging = true;
                        activeWindow = appWindow;
                        
                        const rect = appWindow.getBoundingClientRect();
                        dragState.initialX = e.clientX;
                        dragState.initialY = e.clientY;
                        dragState.initialOffsetX = rect.left;
                        dragState.initialOffsetY = rect.top;

                        // Ensure window is visible and active
                        appWindow.style.display = 'block';
                        appWindow.classList.remove('minimized');
                        focusWindow(appWindow);
                    }
                });

                // Double-click to maximize
                header.addEventListener('dblclick', () => {
                    appWindow.classList.toggle('maximized');
                });
            }

            // Window controls (minimize, maximize, close)
            controls.forEach(control => {
                control.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (control.classList.contains('close')) {
                        appWindow.style.display = 'none';
                        appWindow.classList.remove('active', 'maximized');
                    } else if (control.classList.contains('maximize')) {
                        appWindow.classList.toggle('maximized');
                    } else if (control.classList.contains('minimize')) {
                        appWindow.classList.add('minimized');
                        setTimeout(() => {
                            appWindow.style.display = 'none';
                            appWindow.classList.remove('minimized');
                        }, 300);
                    }
                });
            });

            // Click to focus window
            appWindow.addEventListener('mousedown', () => {
                if (appWindow.style.display !== 'none') {
                    const allWindows = document.querySelectorAll('.app-window');
                    allWindows.forEach(w => w.classList.remove('active'));
                    appWindow.classList.add('active');
                    focusWindow(appWindow);
                    
                    // Update taskbar
                    const appId = appWindow.id.replace('-window', '');
                    const taskbarApp = document.querySelector(`.taskbar-app[data-app="${appId}"]`);
                    if (taskbarApp) {
                        document.querySelectorAll('.taskbar-app').forEach(app => app.classList.remove('active'));
                        taskbarApp.classList.add('active');
                    }
                }
            });
        });

        // Handle dragging
        document.addEventListener('mousemove', (e) => {
            if (dragState.isDragging && activeWindow && !activeWindow.classList.contains('maximized')) {
                const deltaX = e.clientX - dragState.initialX;
                const deltaY = e.clientY - dragState.initialY;
                
                // Calculate new position
                let newX = dragState.initialOffsetX + deltaX;
                let newY = dragState.initialOffsetY + deltaY;
                
                // Keep window within viewport bounds
                const maxX = document.documentElement.clientWidth - activeWindow.offsetWidth;
                const maxY = document.documentElement.clientHeight - activeWindow.offsetHeight;
                newX = Math.max(0, Math.min(newX, maxX));
                newY = Math.max(0, Math.min(newY, maxY));
                
                // Update window position
                activeWindow.style.left = `${newX}px`;
                activeWindow.style.top = `${newY}px`;
                activeWindow.classList.add('dragging');
                
                // Ensure window is visible
                const rect = activeWindow.getBoundingClientRect();
                if (rect.top < 0) {
                    activeWindow.style.top = '0px';
                }
                if (rect.left < 0) {
                    activeWindow.style.left = '0px';
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (activeWindow) {
                activeWindow.classList.remove('dragging');
                activeWindow.style.transition = '';
                
                // Save final position
                const rect = activeWindow.getBoundingClientRect();
                dragState.initialOffsetX = rect.left;
                dragState.initialOffsetY = rect.top;
            }
            dragState.isDragging = false;
            activeWindow = null;
        });

        // Initialize keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + Tab to cycle through windows
            if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
                const visibleWindows = Array.from(windows).filter(w => w.style.display !== 'none');
                if (visibleWindows.length > 0) {
                    const currentIndex = visibleWindows.findIndex(w => w.classList.contains('active'));
                    const nextIndex = (currentIndex + 1) % visibleWindows.length;
                    const nextWindow = visibleWindows[nextIndex];
                    windows.forEach(w => w.classList.remove('active'));
                    nextWindow.classList.add('active');
                    focusWindow(nextWindow);
                }
            }

            // Alt + F4 to close active window
            if (e.altKey && e.key === 'F4') {
                e.preventDefault();
                const activeWindow = Array.from(windows).find(w => w.classList.contains('active'));
                if (activeWindow) {
                    activeWindow.classList.add('closing');
                    setTimeout(() => {
                        activeWindow.style.display = 'none';
                        activeWindow.classList.remove('closing', 'active', 'maximized');
                    }, 300);
                }
            }

            // Alt + Arrow keys for window snapping
            if (e.altKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                const activeWindow = Array.from(windows).find(w => w.classList.contains('active'));
                if (activeWindow) {
                    switch (e.key) {
                        case 'ArrowLeft':
                            activeWindow.style.left = '0';
                            activeWindow.style.width = '50%';
                            activeWindow.style.top = '0';
                            activeWindow.style.height = '100%';
                            break;
                        case 'ArrowRight':
                            activeWindow.style.left = '50%';
                            activeWindow.style.width = '50%';
                            activeWindow.style.top = '0';
                            activeWindow.style.height = '100%';
                            break;
                        case 'ArrowUp':
                            activeWindow.style.left = '0';
                            activeWindow.style.width = '100%';
                            activeWindow.style.top = '0';
                            activeWindow.style.height = '50%';
                            break;
                        case 'ArrowDown':
                            activeWindow.style.left = '0';
                            activeWindow.style.width = '100%';
                            activeWindow.style.top = '50%';
                            activeWindow.style.height = '50%';
                            break;
                    }
                    activeWindow.classList.remove('maximized');
                    activeWindow.style.transform = 'none';
                }
            }

            // Alt + ` to toggle terminal
            if (e.altKey && e.key === '`') {
                e.preventDefault();
                const terminal = document.querySelector('.terminal-window');
                if (terminal) {
                    if (terminal.style.display === 'none') {
                        terminal.style.display = 'block';
                        terminal.classList.add('active');
                        focusWindow(terminal);
                        terminal.querySelector('.terminal-input').focus();
                    } else {
                        terminal.classList.add('minimized');
                        setTimeout(() => {
                            terminal.style.display = 'none';
                            terminal.classList.remove('minimized', 'active');
                        }, 300);
                    }
                }
            }

            // Super key to toggle app launcher
            if (e.key === 'Meta' || e.key === 'Super') {
                e.preventDefault();
                const appLauncher = document.querySelector('.app-launcher');
                if (appLauncher) {
                    if (appLauncher.style.display === 'none') {
                        appLauncher.style.display = 'flex';
                        appLauncher.classList.add('active');
                    } else {
                        appLauncher.style.display = 'none';
                        appLauncher.classList.remove('active');
                    }
                }
            }
        });

        // Initialize windows
        windows.forEach(window => {
            // Set initial position if not set
            if (!window.style.left && !window.style.top) {
                const maxX = document.documentElement.clientWidth - window.offsetWidth;
                const maxY = document.documentElement.clientHeight - window.offsetHeight;
                window.style.left = Math.min(maxX / 2, Math.max(0, maxX)) + 'px';
                window.style.top = Math.min(maxY / 2, Math.max(0, maxY)) + 'px';
            }

            // Set initial z-index, display, and transitions
            window.style.zIndex = '1';
            window.style.transition = 'all 0.3s ease-in-out';
            if (!window.classList.contains('active')) {
                window.style.display = 'none';
            }

            // Ensure window is within viewport bounds
            const rect = window.getBoundingClientRect();
            if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;
                window.style.left = Math.max(0, Math.min(rect.left, maxX)) + 'px';
                window.style.top = Math.max(0, Math.min(rect.top, maxY)) + 'px';
            }

            // Add transition classes
            window.addEventListener('transitionend', () => {
                if (window.classList.contains('minimized') || window.classList.contains('closing')) {
                    window.style.display = 'none';
                    window.classList.remove('minimized', 'closing', 'active', 'maximized');
                }
            });

            // Handle window dragging
            const header = window.querySelector('.window-header');
            if (header) {
                header.addEventListener('mousedown', (e) => {
                    if (!e.target.closest('.control')) {
                        isDragging = true;
                        activeWindow = window;
                        
                        const rect = window.getBoundingClientRect();
                        initialX = e.clientX;
                        initialY = e.clientY;
                        initialOffsetX = rect.left;
                        initialOffsetY = rect.top;

                        window.classList.add('active');
                        window.style.transition = 'none';
                        focusWindow(window);
                    }
                });

                // Double-click to maximize
                header.addEventListener('dblclick', () => {
                    window.classList.toggle('maximized');
                    if (!window.classList.contains('maximized')) {
                        window.style.transform = 'translate(-50%, -50%)';
                    }
                });
            }

            // Window controls
            const controls = window.querySelectorAll('.window-controls .control');
            controls.forEach(control => {
                control.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    if (control.classList.contains('close')) {
                        window.classList.add('closing');
                        setTimeout(() => {
                            window.style.display = 'none';
                            window.classList.remove('closing', 'active', 'maximized');
                            // Update taskbar
                            const appId = window.id.replace('-window', '');
                            const taskbarApp = document.querySelector(`.taskbar-app[data-app="${appId}"]`);
                            if (taskbarApp) {
                                taskbarApp.classList.remove('active');
                            }
                        }, 300);
                    } else if (control.classList.contains('maximize')) {
                        window.classList.toggle('maximized');
                        if (!window.classList.contains('maximized')) {
                            // Center the window when unmaximizing
                            const maxX = document.documentElement.clientWidth - window.offsetWidth;
                            const maxY = document.documentElement.clientHeight - window.offsetHeight;
                            window.style.left = Math.max(0, maxX / 2) + 'px';
                            window.style.top = Math.max(0, maxY / 2) + 'px';
                        }
                    } else if (control.classList.contains('minimize')) {
                        window.classList.add('minimized');
                        window.classList.remove('active');
                        setTimeout(() => {
                            window.style.display = 'none';
                            window.classList.remove('minimized');
                            // Update taskbar
                            const appId = window.id.replace('-window', '');
                            const taskbarApp = document.querySelector(`.taskbar-app[data-app="${appId}"]`);
                            if (taskbarApp) {
                                taskbarApp.classList.remove('active');
                            }
                        }, 300);
                    }
                });
            });

            // Click to focus window
            window.addEventListener('mousedown', () => {
                windows.forEach(w => w.classList.remove('active'));
                window.classList.add('active');
                focusWindow(window);
            });
        });
    }

    const initializeSearch = () => {
        // Project search
        const projectSearch = document.querySelector('.project-search');
        if (projectSearch) {
            projectSearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const projects = document.querySelectorAll('.project-card');

                projects.forEach(project => {
                    const title = project.querySelector('h3').textContent.toLowerCase();
                    const description = project.querySelector('p').textContent.toLowerCase();
                    const techStack = Array.from(project.querySelectorAll('.tech-stack span'))
                        .map(span => span.textContent.toLowerCase());

                    const isVisible = title.includes(searchTerm) ||
                        description.includes(searchTerm) ||
                        techStack.some(tech => tech.includes(searchTerm));

                    project.style.display = isVisible ? '' : 'none';
                });
            });
        }

        // Skills search
        const skillsSearch = document.querySelector('.skills-search');
        if (skillsSearch) {
            skillsSearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const skills = document.querySelectorAll('.skill-item');

                skills.forEach(skill => {
                    const title = skill.querySelector('.skill-header span').textContent.toLowerCase();
                    const details = Array.from(skill.querySelectorAll('.skill-details li'))
                        .map(li => li.textContent.toLowerCase());

                    const isVisible = title.includes(searchTerm) ||
                        details.some(detail => detail.includes(searchTerm));

                    skill.style.display = isVisible ? '' : 'none';
                });
            });
        }
    };

    const initializeViewControls = () => {
        const viewControls = document.querySelectorAll('.view-controls');

        viewControls.forEach(control => {
            const buttons = control.querySelectorAll('.view-btn');
            const parent = control.closest('.app-window');

            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all buttons
                    buttons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    // Update view
                    const view = button.dataset.view;
                    const content = parent.querySelector('.window-content');
                    content.dataset.view = view;
                });
            });
        });
    };

    const initializeFilterControls = () => {
        const filterControls = document.querySelectorAll('.filter-controls');

        filterControls.forEach(control => {
            const checkboxes = control.querySelectorAll('input[type="checkbox"]');
            const parent = control.closest('.app-window');

            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const activeFilters = Array.from(checkboxes)
                        .filter(cb => cb.checked)
                        .map(cb => cb.dataset.filter);

                    const items = parent.querySelectorAll('[data-type]');
                    items.forEach(item => {
                        const type = item.dataset.type;
                        item.style.display = activeFilters.includes(type) ? '' : 'none';
                    });
                });
            });
        });
    };

    const initializeSkillBars = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const progressBar = entry.target.querySelector('.skill-progress');
                    const width = progressBar.style.width;
                    progressBar.style.width = '0';
                    setTimeout(() => {
                        progressBar.style.width = width;
                    }, 100);
                    observer.unobserve(entry.target);
                }
            });
        });

        document.querySelectorAll('.skill-item').forEach(skill => {
            observer.observe(skill);
        });
    };

    const updateClock = () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        document.querySelector('.time').textContent = timeString;
    };
    // Initialize windows
    document.querySelectorAll('.app-window').forEach(window => {
        const header = window.querySelector('.window-header');
        makeWindowDraggable(window, header);
        setupWindowControls(window);
    });

    // Initialize keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Alt + Tab to cycle through windows
        if (e.altKey && e.key === 'Tab') {
            e.preventDefault();
            const visibleWindows = Array.from(document.querySelectorAll('.app-window')).filter(w => w.style.display !== 'none');
            if (visibleWindows.length > 0) {
                const currentIndex = visibleWindows.findIndex(w => w.classList.contains('active'));
                const nextIndex = (currentIndex + 1) % visibleWindows.length;
                focusWindow(visibleWindows[nextIndex]);
            }
        }
        
        // Alt + F4 to close active window
        if (e.altKey && e.key === 'F4') {
            e.preventDefault();
            const activeWindow = document.querySelector('.app-window.active');
            if (activeWindow) {
                activeWindow.style.display = 'none';
                activeWindow.classList.remove('active', 'maximized');
            }
        }
    });

    function makeWindowDraggable(window, header) {
        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (e.target.classList.contains('control')) return;
            e.preventDefault();
            dragState.initialX = e.clientX;
            dragState.initialY = e.clientY;
            dragState.initialOffsetX = parseInt(window.style.left) || 0;
            dragState.initialOffsetY = parseInt(window.style.top) || 0;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
            activateWindow(window);
            dragState.isDragging = true;
        }

        function elementDrag(e) {
            if (dragState.isDragging) {
                e.preventDefault();
                const deltaX = e.clientX - dragState.initialX;
                const deltaY = e.clientY - dragState.initialY;
                
                // Calculate new position
                const newX = dragState.initialOffsetX + deltaX;
                const newY = dragState.initialOffsetY + deltaY;
                
                // Keep window within viewport bounds
                const maxX = document.documentElement.clientWidth - window.offsetWidth;
                const maxY = document.documentElement.clientHeight - window.offsetHeight;
                window.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
                window.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
                window.classList.add('dragging');
            }
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            dragState.isDragging = false;
            window.classList.remove('dragging');
        }
    }

    // Window snapping functionality
    function setupWindowSnapping(window) {
        let snapThreshold = 20; // pixels from edge to trigger snap
        let originalRect;

        function handleSnap(e) {
            if (!window.classList.contains('maximized')) {
                const rect = window.getBoundingClientRect();
                const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

                // Snap to left half
                if (rect.left < snapThreshold) {
                    window.style.left = '0';
                    window.style.top = '0';
                    window.style.width = '50%';
                    window.style.height = '100%';
                }
                // Snap to right half
                else if (rect.right > viewportWidth - snapThreshold) {
                    window.style.left = '50%';
                    window.style.top = '0';
                    window.style.width = '50%';
                    window.style.height = '100%';
                }
                // Maximize on drag to top
                else if (rect.top < snapThreshold) {
                    window.classList.add('maximized');
                }
            }
        }

        window.addEventListener('mouseup', handleSnap);
    }

    function setupWindowControls(window) {
        const controls = window.querySelectorAll('.window-controls .control');
        controls.forEach(control => {
            control.addEventListener('click', (e) => {
                e.stopPropagation();
                if (control.classList.contains('close')) {
                    window.style.display = 'none';
                    if (window.id === 'terminal-window') {
                        document.querySelector('.terminal-window').classList.add('minimized');
                    }
                } else if (control.classList.contains('maximize')) {
                    window.classList.toggle('maximized');
                    if (window.classList.contains('maximized')) {
                        window.dataset.prevPos = JSON.stringify({
                            top: window.style.top,
                            left: window.style.left
                        });
                        window.style.top = '';
                        window.style.left = '';
                    } else {
                        const prevPos = JSON.parse(window.dataset.prevPos || '{}');
                        window.style.top = prevPos.top || '50%';
                        window.style.left = prevPos.left || '50%';
                    }
                } else if (control.classList.contains('minimize')) {
                    window.style.display = 'none';
                }
            });
        });
    }

    function activateWindow(window) {
        if (activeWindow === window) return;
        if (activeWindow) {
            activeWindow.classList.remove('active');
        }
        window.classList.add('active');
        window.style.zIndex = ++zIndex;
        activeWindow = window;
        updateTaskbar();

        // Ensure window is visible within viewport
        if (!window.classList.contains('maximized')) {
            const rect = window.getBoundingClientRect();
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

            if (rect.left < 0) window.style.left = '0';
            if (rect.top < 0) window.style.top = '0';
            if (rect.right > viewportWidth) window.style.left = (viewportWidth - rect.width) + 'px';
            if (rect.bottom > viewportHeight) window.style.top = (viewportHeight - rect.height) + 'px';
        }

        // Add to taskbar if not already there
        const appName = window.id.replace('-window', '');
        addToTaskbar(appName);
    }

    // Setup window snapping for all windows
    windows.forEach(setupWindowSnapping);

    // Desktop Icons and App Launcher
    const desktopIcons = document.querySelectorAll('.desktop-icon, .app-item');
    const desktopIconsContainer = document.querySelector('.desktop-icons');

    // Function to arrange desktop icons in vertical columns
    function arrangeDesktopIcons() {
        const viewportHeight = window.innerHeight;
        const icons = Array.from(desktopIcons);
        
        if (desktopIconsContainer) {
            // Reset any previous styles
            desktopIconsContainer.style.cssText = '';
            
            // Calculate optimal layout
            const maxRows = Math.floor((viewportHeight - 80) / 120); // 120px = icon height (96px) + gap (24px)
            const iconsPerColumn = Math.min(maxRows, 6); // Maximum 6 icons per column
            const columnsNeeded = Math.ceil(icons.length / iconsPerColumn);
            
            // Set grid properties directly on the container
            desktopIconsContainer.style.display = 'grid';
            desktopIconsContainer.style.gridAutoFlow = 'column';
            desktopIconsContainer.style.gridTemplateRows = `repeat(${iconsPerColumn}, 96px)`;
            desktopIconsContainer.style.gridTemplateColumns = `repeat(${columnsNeeded}, 80px)`;
            desktopIconsContainer.style.gap = '24px';
            desktopIconsContainer.style.padding = '24px';
            
            // Ensure all icons are visible
            icons.forEach(icon => {
                icon.style.visibility = 'visible';
                icon.style.opacity = '1';
                icon.style.transform = 'none';
            });
        }
    }

    // Initialize desktop icons arrangement
    arrangeDesktopIcons();
    window.addEventListener('resize', arrangeDesktopIcons);

    // Handle icon clicks
    desktopIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const appName = icon.dataset.app;
            if (appName === 'cv') {
                // Handle CV download
                const link = document.createElement('a');
                link.href = 'cv.pdf';
                link.download = 'Abi_Kemal_Jara_CV.pdf';
                link.click();
                return;
            }
            const window = document.getElementById(`${appName}-window`);
            if (window) {
                window.style.display = 'block';
                activateWindow(window);
                if (appName === 'terminal') {
                    document.querySelector('.terminal-window').classList.remove('minimized');
                    document.querySelector('.terminal-input').focus();
                }
            }
        });
    });

    // App Launcher Toggle
    const appLauncher = document.querySelector('.app-launcher');
    const appLauncherBtn = document.querySelector('.app-launcher-btn');
    appLauncherBtn.addEventListener('click', () => {
        appLauncher.classList.toggle('active');
    });

    // Close App Launcher when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.app-launcher') && 
            !e.target.closest('.app-launcher-btn')) {
            appLauncher.classList.remove('active');
        }
    });

    // Taskbar Apps
    const taskbarApps = document.querySelectorAll('.app-btn');
    const taskbarLeft = document.querySelector('.taskbar-left');

    // Function to update taskbar state
    function updateTaskbar() {
        taskbarApps.forEach(app => {
            const appName = app.dataset.app;
            const window = document.getElementById(`${appName}-window`);
            if (window && window.style.display !== 'none') {
                app.classList.add('active');
            } else {
                app.classList.remove('active');
            }
        });
    }

    // Function to add app to taskbar
    function addToTaskbar(appName) {
        if (!document.querySelector(`.app-btn[data-app="${appName}"]`)) {
            const btn = document.createElement('button');
            btn.className = 'app-btn';
            btn.dataset.app = appName;
            btn.innerHTML = `<i class="fas fa-${getAppIcon(appName)}"></i>`;
            taskbarLeft.querySelector('.active-apps').appendChild(btn);
            setupTaskbarApp(btn);
        }
    }

    // Function to get app icon
    function getAppIcon(appName) {
        const icons = {
            about: 'user',
            skills: 'code',
            projects: 'folder',
            terminal: 'terminal',
            contact: 'envelope',
            cv: 'file-pdf'
        };
        return icons[appName] || 'window-maximize';
    }

    // Setup taskbar app functionality
    function setupTaskbarApp(app) {
        app.addEventListener('click', () => {
            const appName = app.dataset.app;
            const window = document.getElementById(`${appName}-window`);
            if (window) {
                if (window.style.display === 'none') {
                    window.style.display = 'block';
                    activateWindow(window);
                } else if (window.classList.contains('active')) {
                    window.style.display = 'none';
                    updateTaskbar();
                } else {
                    activateWindow(window);
                }
            }
        });
    }

    taskbarApps.forEach(setupTaskbarApp);

    // Update taskbar datetime
    function updateDateTime() {
        const now = new Date();
        const date = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        const time = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const year = now.getFullYear();

        document.querySelector('.datetime-widget .date').textContent = date;
        document.querySelector('.datetime-widget .time').textContent = time;
        document.querySelector('.datetime-widget .year').textContent = year;
    }
    updateDateTime();
    setInterval(updateDateTime, 60000);

    // Update weather (simulated)
    function updateWeather() {
        const weatherStates = [
            { icon: 'sun', temp: '24°C' },
            { icon: 'cloud-sun', temp: '22°C' },
            { icon: 'cloud', temp: '20°C' },
            { icon: 'cloud-rain', temp: '18°C' }
        ];
        const weather = weatherStates[Math.floor(Math.random() * weatherStates.length)];
        
        const weatherWidget = document.querySelector('.weather-widget');
        weatherWidget.querySelector('i').className = `fas fa-${weather.icon}`;
        weatherWidget.querySelector('.temperature').textContent = weather.temp;
    }
    updateWeather();
    setInterval(updateWeather, 300000); // Update every 5 minutes

    // Initialize terminal in minimized state
    const terminalWindow = document.querySelector('.terminal-window');
    terminalWindow.classList.add('minimized');

    const terminalInput = document.querySelector('.terminal-input');
    const commandHistory = document.querySelector('.command-history');
    let commandIndex = -1;
    let commands = JSON.parse(localStorage.getItem('commandHistory') || '[]');
    const MAX_HISTORY = 50;

    // Typing animation function
    function typeWriter(element, text, speed = 50) {
        let i = 0;
        element.textContent = '';
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    // Available commands
    const COMMANDS = {
        readme: () => {
            if (confirm('Would you like to download the README file?')) {
                window.location.href = 'README.md';
                return 'README download started!';
            }
            return 'Download cancelled.';
        },
        cv: () => {
            if (confirm('Would you like to download the CV?')) {
                window.location.href = 'images/cv-template.pdf';
                return 'CV download started!';
            }
            return 'Download cancelled.';
        },
        download: (args) => {
            if (!args) {
                return 'Usage: download <file>\nAvailable files: cv, readme';
            }
            const file = args.toLowerCase();
            if (file === 'cv' || file === 'readme') {
                return COMMANDS[file]();
            }
            return `Unknown file: ${args}\nAvailable files: cv, readme`;
        },
        help: () => {
            const activeApp = document.querySelector('.app-window.active');
            if (activeApp?.classList.contains('settings-window')) {
                return `Settings Commands:
- theme [light/dark] : Change theme
- font [size]       : Change font size (12-20)
- layout [grid/list]: Change layout view
- animations [on/off]: Toggle animations
- clear     : Clear terminal
- exit      : Close settings

Keyboard shortcuts:
- Up/Down   : Navigate command history
- Ctrl+L    : Clear terminal
- Tab       : Command auto-completion`;
            } else if (activeApp?.classList.contains('profile-window')) {
                return `Profile Commands:
- edit [field] [value]: Edit profile info
- export    : Export profile data
- import    : Import profile data
- backup    : Create backup
- restore   : Restore from backup
- clear     : Clear terminal
- exit      : Close profile

Keyboard shortcuts:
- Up/Down   : Navigate command history
- Ctrl+L    : Clear terminal
- Tab       : Command auto-completion`;
            } else {
                return `Available commands:
- about     : Display information about me
- skills    : List my technical skills
- projects  : View my projects
- experience: Show work experience
- education : Display educational background
- contact   : Show contact information
- readme    : Download README file
- cv        : Download CV
- download  : Download a file (usage: download <cv|readme>)
- clear     : Clear the terminal
- neofetch  : Display system information
- ls        : List available sections
- pwd       : Show current directory

Keyboard shortcuts:
- Up/Down   : Navigate command history
- Ctrl+L    : Clear terminal
- Ctrl+C    : Cancel current command
- Tab       : Command auto-completion`;
            }
        },
        
        about: () => {
            const aboutBlock = document.querySelector('.about-section').cloneNode(true);
            return aboutBlock;
        },

        skills: () => {
            const skillsBlock = document.querySelector('.skills-section').cloneNode(true);
            return skillsBlock;
        },

        projects: () => {
            const projectsBlock = document.querySelector('.projects-section').cloneNode(true);
            return projectsBlock;
        },

        experience: () => {
            const experienceBlock = document.querySelector('.experience-section').cloneNode(true);
            return experienceBlock;
        },

        education: () => {
            const educationBlock = document.querySelector('.education-section').cloneNode(true);
            return educationBlock;
        },

        contact: () => {
            const contactBlock = document.querySelector('.contact-section').cloneNode(true);
            return contactBlock;
        },

        cv: () => {
            const cvBlock = document.querySelector('.cv-section').cloneNode(true);
            return cvBlock;
        },

        clear: () => {
            commandHistory.innerHTML = '';
            return '';
        },

        '': () => ''
    };

    // Create new command block
    function createCommandBlock(command, output) {
        const block = document.createElement('div');
        block.className = 'command-block';

        const promptDiv = document.createElement('div');
        promptDiv.className = 'prompt';
        promptDiv.textContent = 'abdi@portfolio:~/portfolio$';

        const commandDiv = document.createElement('div');
        commandDiv.className = 'command';
        commandDiv.textContent = command;

        const outputDiv = document.createElement('div');
        outputDiv.className = 'output';

        if (output instanceof Element) {
            outputDiv.appendChild(output);
        } else {
            outputDiv.innerHTML = output;
        }

        block.appendChild(promptDiv);
        block.appendChild(commandDiv);
        if (output) block.appendChild(outputDiv);

        return block;
    }

    // Process command
    function processCommand(command) {
        const [cmd, ...args] = command.toLowerCase().trim().split(' ');
        const activeApp = document.querySelector('.app-window.active');

        // Handle app-specific commands
        if (activeApp?.classList.contains('settings-window')) {
            switch (cmd) {
                case 'theme':
                    if (!args[0] || !['light', 'dark'].includes(args[0])) {
                        return 'Usage: theme [light/dark]';
                    }
                    document.body.className = `theme-${args[0]}`;
                    return `Theme changed to ${args[0]}`;
                case 'font':
                    const size = parseInt(args[0]);
                    if (!size || size < 12 || size > 20) {
                        return 'Usage: font [size] (12-20)';
                    }
                    document.body.style.fontSize = `${size}px`;
                    return `Font size changed to ${size}px`;
                case 'layout':
                    if (!args[0] || !['grid', 'list'].includes(args[0])) {
                        return 'Usage: layout [grid/list]';
                    }
                    document.body.dataset.layout = args[0];
                    return `Layout changed to ${args[0]} view`;
                case 'animations':
                    if (!args[0] || !['on', 'off'].includes(args[0])) {
                        return 'Usage: animations [on/off]';
                    }
                    document.body.classList.toggle('no-animations', args[0] === 'off');
                    return `Animations turned ${args[0]}`;
                case 'exit':
                    const terminal = document.getElementById('terminal-window');
                    activeApp.classList.add('closing');
                    terminal.classList.add('minimized');
                    setTimeout(() => {
                        activeApp.style.display = 'none';
                        terminal.style.display = 'none';
                        activeApp.classList.remove('closing', 'active');
                        terminal.classList.remove('minimized', 'active');
                    }, 300);
                    return 'Closing settings...';
            }
        } else if (activeApp?.classList.contains('profile-window')) {
            switch (cmd) {
                case 'edit':
                    if (!args[0] || !args[1]) {
                        return 'Usage: edit [field] [value]';
                    }
                    return `Updated ${args[0]} to ${args.slice(1).join(' ')}`;
                case 'export':
                    return 'Profile data exported to profile.json';
                case 'import':
                    return 'Profile data imported successfully';
                case 'backup':
                    return 'Profile backup created';
                case 'restore':
                    return 'Profile restored from backup';
                case 'exit':
                    const terminal = document.getElementById('terminal-window');
                    activeApp.classList.add('closing');
                    terminal.classList.add('minimized');
                    setTimeout(() => {
                        activeApp.style.display = 'none';
                        terminal.style.display = 'none';
                        activeApp.classList.remove('closing', 'active');
                        terminal.classList.remove('minimized', 'active');
                    }, 300);
                    return 'Closing profile...';
            }
        }

        // Handle general commands
        if (COMMANDS[cmd]) {
            return COMMANDS[cmd]();
        } else {
            return `Command not found: ${cmd}. Type 'help' for available commands.`;
        }
    }

    // Handle command execution
    function executeCommand(command) {
        const output = processCommand(command);
        const commandBlock = createCommandBlock(command, output);
        commandHistory.appendChild(commandBlock);
        commandBlock.scrollIntoView({ behavior: 'smooth' });
        
        // Save command to history if it's not empty and not a duplicate
        if (command.trim() && commands[commands.length - 1] !== command) {
            commands.push(command);
            if (commands.length > MAX_HISTORY) {
                commands.shift();
            }
            localStorage.setItem('commandHistory', JSON.stringify(commands));
        }
        commandIndex = commands.length;

        // Add typing animation for text outputs
        const outputText = commandBlock.querySelector('.output');
        if (outputText && typeof output === 'string') {
            typeWriter(outputText, output);
        }

        // Add click-to-copy for code blocks and commands
        const codeBlocks = commandBlock.querySelectorAll('pre, .command');
        codeBlocks.forEach(block => {
            block.addEventListener('click', () => {
                navigator.clipboard.writeText(block.textContent);
                showToast('Copied to clipboard!');
            });
            block.title = 'Click to copy';
            block.style.cursor = 'pointer';
        });
    }

    // Additional commands
    COMMANDS.neofetch = () => document.querySelector('.ascii-art').parentElement.innerHTML;
    COMMANDS.ls = () => `Available sections:
📂 about/
📂 skills/
📂 projects/
📂 experience/
📂 education/
📂 contact/
📄 cv.pdf`;
    COMMANDS.pwd = () => '/home/abdi/portfolio';

    // Command auto-completion
    function getAutoCompletion(input) {
        const availableCommands = Object.keys(COMMANDS);
        const matches = availableCommands.filter(cmd => cmd.startsWith(input.toLowerCase()));
        return matches.length === 1 ? matches[0] : '';
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Super (Windows/Command) key to toggle app launcher
        if (e.key === 'Meta' || e.key === 'Super') {
            e.preventDefault();
            const appLauncher = document.querySelector('.app-launcher');
            if (appLauncher) {
                appLauncher.classList.toggle('active');
            }
        }

        // Alt + ` to toggle terminal
        if (e.key === '`' && e.altKey) {
            e.preventDefault();
            const terminal = document.getElementById('terminal-window');
            if (terminal.style.display === 'none') {
                terminal.style.display = 'block';
                activateWindow(terminal);
                terminalInput.focus();
            } else {
                terminal.style.display = 'none';
            }
        }

        // Alt + Tab to cycle through windows
        if (e.key === 'Tab' && e.altKey) {
            e.preventDefault();
            const allWindows = document.querySelectorAll('.app-window');
            const visibleWindows = Array.from(allWindows).filter(w => w.style.display !== 'none');
            if (visibleWindows.length > 1) {
                const currentIndex = visibleWindows.indexOf(activeWindow);
                const nextIndex = (currentIndex + 1) % visibleWindows.length;
                activateWindow(visibleWindows[nextIndex]);
            }
        }

        // Alt + F4 to close active window
        if (e.key === 'F4' && e.altKey) {
            e.preventDefault();
            if (activeWindow) {
                activeWindow.style.display = 'none';
                updateTaskbar();
            }
        }

        // Windows key + Up/Down/Left/Right for window snapping
        if (e.altKey && activeWindow && !activeWindow.classList.contains('maximized')) {
            const rect = activeWindow.getBoundingClientRect();
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    activeWindow.classList.add('maximized');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (activeWindow.classList.contains('maximized')) {
                        activeWindow.classList.remove('maximized');
                    } else {
                        activeWindow.style.display = 'none';
                        updateTaskbar();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    activeWindow.style.left = '0';
                    activeWindow.style.top = '0';
                    activeWindow.style.width = '50%';
                    activeWindow.style.height = '100%';
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    activeWindow.style.left = '50%';
                    activeWindow.style.top = '0';
                    activeWindow.style.width = '50%';
                    activeWindow.style.height = '100%';
                    break;
            }
        }
    });

    // Double-click window header to maximize
    const allWindows = document.querySelectorAll('.app-window');
    allWindows.forEach(appWindow => {
        const header = appWindow.querySelector('.window-header');
        if (header) {
            header.addEventListener('dblclick', (e) => {
                if (!e.target.classList.contains('control')) {
                    appWindow.classList.toggle('maximized');
                    if (appWindow.classList.contains('maximized')) {
                        appWindow.dataset.prevPos = JSON.stringify({
                            top: appWindow.style.top,
                            left: appWindow.style.left,
                            width: appWindow.style.width,
                            height: appWindow.style.height
                        });
                        appWindow.style.top = '';
                        appWindow.style.left = '';
                        appWindow.style.width = '';
                        appWindow.style.height = '';
                    } else {
                        const prevPos = JSON.parse(appWindow.dataset.prevPos || '{}');
                        appWindow.style.top = prevPos.top || '50%';
                        appWindow.style.left = prevPos.left || '50%';
                        appWindow.style.width = prevPos.width || '';
                        appWindow.style.height = prevPos.height || '';
                    }
                }
            });
        }
    });

    // Handle terminal keyboard events
    if (terminalInput) {
        terminalInput.addEventListener('keydown', (e) => {
            // Enter key - execute command
            if (e.key === 'Enter') {
                const command = terminalInput.value;
                terminalInput.value = '';
                executeCommand(command);
                commands.push(command);
                commandIndex = commands.length;
            }
            // Up arrow - previous command
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (commandIndex > 0) {
                    commandIndex--;
                    terminalInput.value = commands[commandIndex];
                }
            }
            // Down arrow - next command
            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (commandIndex < commands.length - 1) {
                    commandIndex++;
                    terminalInput.value = commands[commandIndex];
                } else {
                    commandIndex = commands.length;
                    terminalInput.value = '';
                }
            }
            // Tab - auto-completion
            else if (e.key === 'Tab') {
                e.preventDefault();
                const completion = getAutoCompletion(terminalInput.value);
                if (completion) {
                    terminalInput.value = completion;
                }
            }
            // Ctrl+L - clear terminal
            else if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault();
                executeCommand('clear');
            }
            // Ctrl+C - cancel command
            else if (e.key === 'c' && e.ctrlKey) {
                e.preventDefault();
                const commandBlock = createCommandBlock(terminalInput.value, '^C');
                commandHistory.appendChild(commandBlock);
                terminalInput.value = '';
            }
        });
    }

    // Show toast notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }, 100);
    }

    // Handle window controls for terminal
    const terminalControls = document.querySelectorAll('.terminal-window .window-controls .control');
    terminalControls.forEach(control => {
        control.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (control.classList.contains('minimize')) {
                terminalWindow.classList.add('minimized');
                setTimeout(() => {
                    terminalWindow.style.display = 'none';
                    terminalWindow.classList.remove('minimized', 'active');
                }, 300);
            } else if (control.classList.contains('maximize')) {
                terminalWindow.classList.toggle('maximized');
            } else if (control.classList.contains('close')) {
                terminalWindow.style.display = 'none';
                terminalWindow.classList.remove('active', 'maximized');
            }
        });
    });

    // Handle terminal dragging
    const terminal = document.querySelector('.terminal-window');
    const header = document.querySelector('.terminal-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target.classList.contains('control')) return;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === header) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            terminal.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }

    function dragEnd() {
        isDragging = false;
    }

    // Focus input on terminal click
    const terminalContainer = document.querySelector('.terminal');
    if (terminalContainer && terminalInput) {
        terminalContainer.addEventListener('click', (e) => {
            if (!e.target.classList.contains('control')) {
                terminalInput.focus();
            }
        });
    }

    // Initial focus
    terminalInput.focus();

    // Execute initial help command with typing animation
    executeCommand('help');
});


    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target.classList.contains('control')) return;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === header) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            terminal.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }

    function dragEnd() {
        isDragging = false;
    }

    // Focus input on terminal click
    const terminalContainer = document.querySelector('.terminal');
    if (terminalContainer && terminalInput) {
        terminalContainer.addEventListener('click', (e) => {
            if (!e.target.classList.contains('control')) {
                terminalInput.focus();
            }
        });
    }

    // Initial focus
    terminalInput.focus();

    // Execute initial help command with typing animation
    executeCommand('help') 

