document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Tab Navigation Router
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    function navigateToSection(sectionId) {
        sections.forEach(sec => sec.classList.remove('active'));
        navItems.forEach(item => item.classList.remove('active'));

        const targetSection = document.getElementById(sectionId);
        const targetNavItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);

        if (targetSection) targetSection.classList.add('active');
        if (targetNavItem) targetNavItem.classList.add('active');
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            navigateToSection(sectionId);
            window.location.hash = sectionId;
        });
    });

    // Check hash on load
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        navigateToSection(hash);
    }

    // 2. Instant Search Filter
    const searchInput = document.getElementById('api-search');
    const apiCards = document.querySelectorAll('.api-card');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        apiCards.forEach(card => {
            const methodName = card.querySelector('.api-method')?.textContent.toLowerCase() || '';
            const desc = card.querySelector('.api-desc')?.textContent.toLowerCase() || '';
            
            if (methodName.includes(query) || desc.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        // Auto-switch to relevant category section if all matches are in it
        if (query.length > 2) {
            // Find sections containing visible cards
            sections.forEach(sec => {
                if (sec.id === 'overview' || sec.id === 'playground') return;
                const visibleCards = sec.querySelectorAll('.api-card[style="display: block;"]');
                if (visibleCards.length > 0 && !sec.classList.contains('active')) {
                    navigateToSection(sec.id);
                }
            });
        }
    });

    // 3. Preset Scripts
    const codeEditor = document.getElementById('playground-code');
    const presetDt = document.getElementById('load-dt-preset');
    const presetAa = document.getElementById('load-aa-preset');

    presetDt.addEventListener('click', () => {
        codeEditor.value = `-- Doubletap Indicator Preset
local draw_dt = menu.add_checkbox("Enable Doubletap Indicators", true)
local bar_speed = menu.add_slider_int("Spring Velocity", 1, 15, 6)

client.register_callback("paint", function()
    if draw_dt then
        -- Draw main panel
        draw.rect(20, 20, 160, 42, 15, 15, 15, 240)
        draw.outlined_rect(20, 20, 160, 42, 0, 0, 0, 255)
        
        -- Text headings
        draw.text("DOUBLETAP", 28, 26, 240, 240, 240, 255, "esp")
        
        -- Simulated ticks charging
        local dt_fraction = (math.floor(os.time() * 2) % 2 == 0) and 1.0 or 0.0
        draw.animated_bar("dt_bar", 28, 44, 144, 4, dt_fraction, 255, 0, 127, 255, "spring", bar_speed)
    end
end)`;
        runSimulator();
    });

    presetAa.addEventListener('click', () => {
        codeEditor.value = `-- Anti-Aim Compass Widget Preset
local draw_aa = menu.add_checkbox("Draw AA Widget", true)
local accent_r = menu.add_slider_int("Accent Red", 0, 255, 255)

client.register_callback("paint", function()
    if draw_aa then
        draw.rect(20, 20, 180, 80, 15, 15, 15, 240)
        draw.outlined_rect(20, 20, 180, 80, 0, 0, 0, 255)
        
        draw.text("ANTI-AIM", 28, 26, 240, 240, 240, 255, "esp")
        
        -- Draw radar circles
        draw.circle(50, 65, 15, 20, 80, 80, 80, 255)
        
        -- Animated text details
        draw.animated_text("aa_stat", "DESYNCED", 80, 56, accent_r, 0, 127, 255, "pulse", 5.0, "esp_small")
    end
end)`;
        runSimulator();
    });

    // 4. LUA Simulation Playground Engine Canvas
    const canvas = document.getElementById('simulator-canvas');
    const ctx = canvas.getContext('2d');
    const menuContainer = document.getElementById('mock-menu-items');

    // Canvas scaling to match viewport mockup resolution
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Simulator State Registers
    let paintCallbacks = [];
    let menuItems = {}; // label -> { type, value, controlElement }
    let animationStates = {}; // id -> { current, velocity, target }

    // Mock API implementations exposed to the playground interpreter
    const mockDraw = {
        rect: (x, y, w, h, r, g, b, a) => {
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            ctx.fillRect(x, y, w, h);
        },
        outlined_rect: (x, y, w, h, r, g, b, a) => {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        },
        filled_rounded_rect: (x, y, w, h, rad, r, g, b, a) => {
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, rad);
            ctx.fill();
        },
        outlined_rounded_rect: (x, y, w, h, rad, r, g, b, a) => {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, rad);
            ctx.stroke();
        },
        head_box: (fake, r, g, b, a) => {
            // Draw a cute simulated 3D head box in the center of the mock preview screen
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            ctx.lineWidth = 1.5;
            
            // Draw a mock 3D cube near the crosshair
            const cx = canvas.width / 2 + (fake ? 25 : -25);
            const cy = canvas.height / 2 - 40;
            const size = 15;
            
            // Front face
            ctx.strokeRect(cx - size/2, cy - size/2, size, size);
            
            // Back face (offset)
            const off = 5;
            ctx.strokeRect(cx - size/2 + off, cy - size/2 - off, size, size);
            
            // Connecting corners
            ctx.beginPath();
            ctx.moveTo(cx - size/2, cy - size/2);
            ctx.lineTo(cx - size/2 + off, cy - size/2 - off);
            
            ctx.moveTo(cx + size/2, cy - size/2);
            ctx.lineTo(cx + size/2 + off, cy - size/2 - off);
            
            ctx.moveTo(cx - size/2, cy + size/2);
            ctx.lineTo(cx - size/2 + off, cy + size/2 - off);
            
            ctx.moveTo(cx + size/2, cy + size/2);
            ctx.lineTo(cx + size/2 + off, cy + size/2 - off);
            ctx.stroke();
        },
        text: (text, x, y, r, g, b, a, font) => {
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            ctx.font = font === 'esp_small' ? 'bold 10px Outfit' : 'bold 12px Outfit';
            ctx.fillText(text, x, y + 8);
        },
        line: (x1, y1, x2, y2, r, g, b, a) => {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x1 + 0.5, y1 + 0.5);
            ctx.lineTo(x2 + 0.5, y2 + 0.5);
            ctx.stroke();
        },
        circle: (x, y, rad, seg, r, g, b, a) => {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, rad, 0, 2 * Math.PI);
            ctx.stroke();
        },
        screen_size: () => {
            return [canvas.width, canvas.height];
        },
        text_size: (text, font) => {
            ctx.font = font === 'esp_small' ? 'bold 10px Outfit' : 'bold 12px Outfit';
            const metrics = ctx.measureText(text);
            return [Math.ceil(metrics.width), font === 'esp_small' ? 10 : 12];
        },
        animated_bar: (id, x, y, w, h, target, r, g, b, a, type, speed) => {
            if (!animationStates[id]) {
                animationStates[id] = { current: 0, velocity: 0, target: target };
            }
            const state = animationStates[id];
            state.target = target;

            const dt = 0.016; // constant step (~60fps)
            const spd = speed || 10;

            if (type === 'spring' || type === 'bounce') {
                const tension = spd * 15;
                const damping = 2 * Math.sqrt(tension) * 0.7;
                const displacement = state.target - state.current;
                const force = (displacement * tension) - (state.velocity * damping);
                state.velocity += force * dt;
                state.current += state.velocity * dt;
            } else {
                state.current += (state.target - state.current) * (spd * dt);
            }

            const drawFraction = Math.max(0, Math.min(1, state.current));

            // Background
            ctx.fillStyle = `rgba(28, 28, 28, ${a / 255})`;
            ctx.fillRect(x, y, w, h);

            // Filled rect
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            ctx.fillRect(x, y, w * drawFraction, h);

            // Outline
            ctx.strokeStyle = `rgba(0, 0, 0, ${a / 255})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        },
        animated_text: (id, text, x, y, r, g, b, a, type, speed, font) => {
            const spd = speed || 5;
            const time = Date.now() / 1000;
            let drawX = x;
            let drawY = y;
            let drawAlpha = a;

            if (type === 'pulse') {
                const wave = Math.sin(time * spd) * 0.5 + 0.5;
                drawAlpha = a * (0.3 + wave * 0.7);
            } else if (type === 'shake') {
                drawX += Math.sin(time * spd * 15) * 1.5;
                drawY += Math.cos(time * spd * 18) * 1.5;
            } else if (type === 'wave') {
                drawY += Math.sin(time * spd) * 3;
            }

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${drawAlpha / 255})`;
            ctx.font = font === 'esp_small' ? 'bold 10px Outfit' : 'bold 12px Outfit';
            ctx.fillText(text, drawX, drawY + 8);
        }
    };

    const mockMenu = {
        add_checkbox: (label, defaultVal) => {
            if (menuItems[label] === undefined) {
                menuItems[label] = { type: 'checkbox', value: defaultVal };
                createMockUIElement(label, 'checkbox', defaultVal);
            }
            return menuItems[label].value;
        },
        add_slider_int: (label, min, max, defaultVal) => {
            if (menuItems[label] === undefined) {
                menuItems[label] = { type: 'slider', value: defaultVal, min, max };
                createMockUIElement(label, 'slider', defaultVal, min, max);
            }
            return menuItems[label].value;
        },
        add_select: (label, options, defaultIdx) => {
            if (menuItems[label] === undefined) {
                menuItems[label] = { type: 'select', value: defaultIdx, options };
                createMockUIElement(label, 'select', defaultIdx, null, null, options);
            }
            return menuItems[label].value;
        }
    };

    const mockClient = {
        log: (msg) => console.log(`[baby.tech] ${msg}`),
        register_callback: (name, cb) => {
            if (name === 'paint') paintCallbacks.push(cb);
        },
        menu_accent: () => [255, 0, 127]
    };

    // Helper to generate dynamic Mock UI Controls in the Playground
    function createMockUIElement(label, type, defaultVal, min, max, options) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mock-control';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        wrapper.appendChild(labelEl);

        let inputEl;
        if (type === 'checkbox') {
            inputEl = document.createElement('input');
            inputEl.type = 'checkbox';
            inputEl.className = 'mock-checkbox';
            inputEl.checked = defaultVal;
            inputEl.addEventListener('change', (e) => {
                menuItems[label].value = e.target.checked;
            });
        } else if (type === 'slider') {
            inputEl = document.createElement('input');
            inputEl.type = 'range';
            inputEl.className = 'mock-slider';
            inputEl.min = min;
            inputEl.max = max;
            inputEl.value = defaultVal;
            inputEl.addEventListener('input', (e) => {
                menuItems[label].value = parseInt(e.target.value);
            });
        } else if (type === 'select') {
            inputEl = document.createElement('select');
            inputEl.className = 'mock-select';
            options.forEach((opt, idx) => {
                const optEl = document.createElement('option');
                optEl.value = idx + 1;
                optEl.textContent = opt;
                if (idx + 1 === defaultVal) optEl.selected = true;
                inputEl.appendChild(optEl);
            });
            inputEl.addEventListener('change', (e) => {
                menuItems[label].value = parseInt(e.target.value);
            });
        }

        wrapper.appendChild(inputEl);
        menuContainer.appendChild(wrapper);
    }

    // Custom Mock LUA Interpreter sandbox execution
    function runSimulator() {
        // Reset states
        paintCallbacks = [];
        menuContainer.innerHTML = '';
        menuItems = {};

        const scriptContent = codeEditor.value;

        // Sandboxed evaluation environment mapper
        try {
            // Translate LUA constructs to JS matches inside sandbox context
            const sandboxedJS = scriptContent
                // Replace comments
                .replace(/--.*/g, '')
                // Replace lua namespaces
                .replace(/draw\./g, 'draw.')
                .replace(/menu\./g, 'menu.')
                .replace(/client\./g, 'client.')
                // Match standard LUA constructs to basic JS
                .replace(/local\s+/g, 'let ')
                .replace(/function\s*\((.*?)\)/g, '($1) =>')
                .replace(/function\s+(\w+)\s*\((.*?)\)/g, 'const $1 = ($2) =>')
                .replace(/end/g, '}')
                .replace(/then/g, '{')
                .replace(/else\s*\{/g, 'else {')
                .replace(/elseif/g, 'else if')
                .replace(/math\.floor/g, 'Math.floor')
                .replace(/math\.sin/g, 'Math.sin')
                .replace(/math\.cos/g, 'Math.cos')
                .replace(/os\.time/g, '(() => Date.now()/1000)')
                .replace(/client\.register_callback\s*\(\s*["']paint["']\s*,\s*(.*?)\s*\)/g, 'client.register_callback("paint", $1)');

            const runSandbox = new Function('draw', 'menu', 'client', sandboxedJS);
            runSandbox(mockDraw, mockMenu, mockClient);
        } catch (err) {
            console.error("Interpreter failed parsing LUA syntax:", err);
            // Draw syntax error on simulated screen
            ctx.fillStyle = '#ff3f34';
            ctx.font = '12px Outfit';
            ctx.fillText("LUA Compilation/Parsing Error:", 20, 40);
            ctx.fillText(err.message, 20, 60);
        }
    }

    document.getElementById('run-code-btn').addEventListener('click', runSimulator);

    // Frame Tick Update Loop
    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        paintCallbacks.forEach(cb => {
            try {
                cb();
            } catch (err) {
                // suppress runtime errors
            }
        });

        requestAnimationFrame(tick);
    }

    // Auto-run initial code preset
    runSimulator();
    requestAnimationFrame(tick);
});
