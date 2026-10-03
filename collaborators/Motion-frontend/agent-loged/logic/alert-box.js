// Custom Alert Box Component
class AlertBox {
    constructor() {
        this.createAlertContainer();
    }

    createAlertContainer() {
        if (document.getElementById('custom-alert-container')) return;

        const container = document.createElement('div');
        container.id = 'custom-alert-container';
        container.innerHTML = `
            <div class="alert-overlay" id="alert-overlay"></div>
            <div class="alert-box" id="alert-box">
                <div class="alert-icon" id="alert-icon"></div>
                <div class="alert-content">
                    <h3 class="alert-title" id="alert-title"></h3>
                    <p class="alert-message" id="alert-message"></p>
                </div>
                <div class="alert-actions" id="alert-actions">
                    <button class="alert-btn alert-btn-primary" id="alert-btn-ok">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Add styles
        this.addStyles();

        // Add event listeners
        document.getElementById('alert-overlay').addEventListener('click', () => this.close());
        document.getElementById('alert-btn-ok').addEventListener('click', () => this.close());
    }

    addStyles() {
        if (document.getElementById('alert-box-styles')) return;

        const style = document.createElement('style');
        style.id = 'alert-box-styles';
        style.textContent = `
            #custom-alert-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: none;
            }

            #custom-alert-container.show {
                display: block;
            }

            .alert-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                animation: fadeIn 0.3s ease;
            }

            .alert-box {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                max-width: 450px;
                width: 90%;
                padding: 2rem;
                animation: slideIn 0.3s ease;
            }

            .alert-icon {
                width: 60px;
                height: 60px;
                margin: 0 auto 1.5rem;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
            }

            .alert-icon.success {
                background: #d4edda;
                color: #28a745;
            }

            .alert-icon.error {
                background: #f8d7da;
                color: #dc3545;
            }

            .alert-icon.warning {
                background: #fff3cd;
                color: #ffc107;
            }

            .alert-icon.info {
                background: #d1ecf1;
                color: #17a2b8;
            }

            .alert-content {
                text-align: center;
                margin-bottom: 1.5rem;
            }

            .alert-title {
                font-size: 1.5rem;
                font-weight: 600;
                margin: 0 0 0.5rem 0;
                color: #333;
            }

            .alert-message {
                font-size: 1rem;
                color: #666;
                margin: 0;
                line-height: 1.5;
                white-space: pre-line;
            }

            .alert-actions {
                display: flex;
                gap: 0.75rem;
                justify-content: center;
            }

            .alert-btn {
                padding: 0.75rem 2rem;
                border: none;
                border-radius: 6px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .alert-btn-primary {
                background: #007bff;
                color: white;
            }

            .alert-btn-primary:hover {
                background: #0056b3;
            }

            .alert-btn-secondary {
                background: #6c757d;
                color: white;
            }

            .alert-btn-secondary:hover {
                background: #545b62;
            }

            .alert-btn-success {
                background: #28a745;
                color: white;
            }

            .alert-btn-success:hover {
                background: #218838;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes slideIn {
                from {
                    transform: translate(-50%, -60%);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, -50%);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    show({ title, message, type = 'info', buttons = null, onClose = null }) {
        const container = document.getElementById('custom-alert-container');
        const alertBox = document.getElementById('alert-box');
        const icon = document.getElementById('alert-icon');
        const titleEl = document.getElementById('alert-title');
        const messageEl = document.getElementById('alert-message');
        const actionsEl = document.getElementById('alert-actions');

        // Set icon
        icon.className = `alert-icon ${type}`;
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        icon.textContent = icons[type] || icons.info;

        // Set content
        titleEl.textContent = title;
        messageEl.textContent = message;

        // Set buttons
        if (buttons) {
            actionsEl.innerHTML = '';
            buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = `alert-btn alert-btn-${btn.type || 'primary'}`;
                button.textContent = btn.text;
                button.addEventListener('click', () => {
                    if (btn.onClick) btn.onClick();
                    this.close();
                });
                actionsEl.appendChild(button);
            });
        } else {
            actionsEl.innerHTML = '<button class="alert-btn alert-btn-primary" id="alert-btn-ok">OK</button>';
            document.getElementById('alert-btn-ok').addEventListener('click', () => this.close());
        }

        // Store onClose callback
        this.onCloseCallback = onClose;

        // Show alert
        container.classList.add('show');
    }

    close() {
        const container = document.getElementById('custom-alert-container');
        container.classList.remove('show');
        
        if (this.onCloseCallback) {
            this.onCloseCallback();
            this.onCloseCallback = null;
        }
    }

    success(title, message, onClose) {
        this.show({ title, message, type: 'success', onClose });
    }

    error(title, message, onClose) {
        this.show({ title, message, type: 'error', onClose });
    }

    warning(title, message, onClose) {
        this.show({ title, message, type: 'warning', onClose });
    }

    info(title, message, onClose) {
        this.show({ title, message, type: 'info', onClose });
    }

    confirm(title, message, onConfirm, onCancel) {
        this.show({
            title,
            message,
            type: 'warning',
            buttons: [
                {
                    text: 'Cancel',
                    type: 'secondary',
                    onClick: onCancel
                },
                {
                    text: 'Confirm',
                    type: 'primary',
                    onClick: onConfirm
                }
            ]
        });
    }
}

// Create global instance
const alertBox = new AlertBox();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlertBox;
}
