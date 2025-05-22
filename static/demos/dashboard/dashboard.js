// Dashboard Demo Interactive Features
const DashboardDemo = {
    // Simulated data
    data: {
        revenue: {
            daily: [12500, 13200, 14800, 13900, 15600, 14200, 15800],
            weekly: [84000, 90500, 88700, 92300, 96800],
            monthly: [320000, 345000, 362000, 378000],
            yearly: [3800000, 4200000, 4500000, 4900000],
            dateLabels: {
                daily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                weekly: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                monthly: ['Jan', 'Feb', 'Mar', 'Apr'],
                yearly: ['2022', '2023', '2024', '2025']
            }
        },
        sales: {
            byCategory: [
                { name: 'Electronics', value: 45 },
                { name: 'Clothing', value: 25 },
                { name: 'Home & Garden', value: 15 },
                { name: 'Books', value: 10 },
                { name: 'Other', value: 5 }
            ],
            byRegion: [
                { name: 'North America', value: 40 },
                { name: 'Europe', value: 30 },
                { name: 'Asia', value: 20 },
                { name: 'Other', value: 10 }
            ],
            byChannel: [
                { name: 'Online', value: 65 },
                { name: 'Retail', value: 25 },
                { name: 'Partners', value: 10 }
            ]
        },
        orders: [
            { id: 'ORD-5893', customer: 'John Smith', product: 'Premium Headphones', amount: 149.99, status: 'completed', date: 'May 15, 2025' },
            { id: 'ORD-5892', customer: 'Emily Johnson', product: 'Wireless Mouse', amount: 39.99, status: 'processing', date: 'May 15, 2025' },
            { id: 'ORD-5891', customer: 'Michael Brown', product: 'Mechanical Keyboard', amount: 89.95, status: 'pending', date: 'May 14, 2025' },
            { id: 'ORD-5890', customer: 'Sarah Wilson', product: 'Smartphone Stand', amount: 24.95, status: 'completed', date: 'May 14, 2025' },
            { id: 'ORD-5889', customer: 'David Taylor', product: 'Gaming Headset', amount: 129.99, status: 'cancelled', date: 'May 13, 2025' },
            { id: 'ORD-5888', customer: 'Jessica Allen', product: 'Bluetooth Speaker', amount: 79.99, status: 'completed', date: 'May 13, 2025' },
            { id: 'ORD-5887', customer: 'Robert White', product: 'USB-C Hub', amount: 49.95, status: 'processing', date: 'May 12, 2025' },
            { id: 'ORD-5886', customer: 'Amanda Lee', product: 'Fitness Tracker', amount: 119.99, status: 'completed', date: 'May 12, 2025' }
        ],
        kpi: {
            totalRevenue: { value: 125430, trend: 12.5, trendDirection: 'up' },
            newCustomers: { value: 2340, trend: 8.2, trendDirection: 'up' },
            totalOrders: { value: 5870, trend: 3.7, trendDirection: 'up' },
            returnRate: { value: 2.8, trend: 0.6, trendDirection: 'down' }
        }
    },
    
    // Settings and state
    settings: {
        timeRange: 'last7days',
        salesView: 'byCategory',
        darkMode: false
    },
    
    // LocalStorage handling
    storage: {
        saveSettings() {
            localStorage.setItem('dashboard-settings', JSON.stringify(DashboardDemo.settings));
        },
        
        loadSettings() {
            const savedSettings = localStorage.getItem('dashboard-settings');
            if (savedSettings) {
                DashboardDemo.settings = {...DashboardDemo.settings, ...JSON.parse(savedSettings)};
            }
        },
        
        clearStorage() {
            localStorage.removeItem('dashboard-settings');
        }
    },
    
    // UI handling
    ui: {
        // Charts
        charts: {
            // Revenue chart
            renderRevenueChart() {
                const chartContainer = document.querySelector('.chart-placeholder');
                if (!chartContainer) return;
                
                // Determine which data to show based on selected time range
                let data, labels;
                switch(DashboardDemo.settings.timeRange) {
                    case 'last7days':
                        data = DashboardDemo.data.revenue.daily;
                        labels = DashboardDemo.data.revenue.dateLabels.daily;
                        break;
                    case 'last30days':
                        data = DashboardDemo.data.revenue.weekly;
                        labels = DashboardDemo.data.revenue.dateLabels.weekly;
                        break;
                    case 'last90days':
                        data = DashboardDemo.data.revenue.monthly;
                        labels = DashboardDemo.data.revenue.dateLabels.monthly;
                        break;
                    case 'lastyear':
                        data = DashboardDemo.data.revenue.yearly;
                        labels = DashboardDemo.data.revenue.dateLabels.yearly;
                        break;
                    default:
                        data = DashboardDemo.data.revenue.daily;
                        labels = DashboardDemo.data.revenue.dateLabels.daily;
                }
                
                // Create a simple chart
                let html = '<div class="chart-container">';
                html += '<div class="chart-legend"><div style="text-align:center; margin-bottom:10px;">';
                
                // Add labels
                labels.forEach(label => {
                    html += `<span class="chart-label">${label}</span>`;
                });
                html += '</div></div>';
                
                // Add bars
                html += '<div class="chart-bars">';
                const maxValue = Math.max(...data);
                data.forEach((value, index) => {
                    const height = (value / maxValue) * 200; // 200px max height
                    html += `
                        <div class="chart-bar-container">
                            <div class="chart-bar" style="height: ${height}px;" title="$${value.toLocaleString()}"></div>
                            <div class="chart-value">$${this.formatCurrency(value)}</div>
                        </div>
                    `;
                });
                html += '</div></div>';
                
                chartContainer.innerHTML = html;
            },
            
            // Sales distribution chart
            renderSalesChart() {
                const chartContainer = document.querySelectorAll('.chart-placeholder')[1];
                if (!chartContainer) return;
                
                // Get the correct data based on the view
                let data;
                switch(DashboardDemo.settings.salesView) {
                    case 'byCategory':
                        data = DashboardDemo.data.sales.byCategory;
                        break;
                    case 'byRegion':
                        data = DashboardDemo.data.sales.byRegion;
                        break;
                    case 'byChannel':
                        data = DashboardDemo.data.sales.byChannel;
                        break;
                    default:
                        data = DashboardDemo.data.sales.byCategory;
                }
                
                // Create a simple pie chart
                let html = '<div class="pie-chart-container">';
                
                // Create the pie chart
                html += '<div class="pie-chart">';
                
                // Calculate the total
                const total = data.reduce((sum, item) => sum + item.value, 0);
                
                // Calculate starting and ending angles for each segment
                let startAngle = 0;
                data.forEach((item, index) => {
                    const percent = item.value / total;
                    const endAngle = startAngle + (percent * 360);
                    
                    // Generate a color based on index
                    const hue = (index * 137) % 360; // Golden angle approximation for good distribution
                    const color = `hsl(${hue}, 70%, 60%)`;
                    
                    // Create the segment
                    html += `
                        <div class="pie-segment" style="
                            --start: ${startAngle}deg;
                            --end: ${endAngle}deg;
                            --color: ${color};"
                            title="${item.name}: ${item.value}%">
                        </div>
                    `;
                    
                    startAngle = endAngle;
                });
                
                html += '</div>';
                
                // Add the legend
                html += '<div class="pie-legend">';
                data.forEach((item, index) => {
                    const hue = (index * 137) % 360;
                    const color = `hsl(${hue}, 70%, 60%)`;
                    
                    html += `
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: ${color};"></div>
                            <div class="legend-label">${item.name}</div>
                            <div class="legend-value">${item.value}%</div>
                        </div>
                    `;
                });
                html += '</div>';
                
                html += '</div>';
                
                chartContainer.innerHTML = html;
            },
            
            // Helper for formatting currency
            formatCurrency(value) {
                if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                } else {
                    return value.toString();
                }
            }
        },
        
        // Initialize the UI
        init() {
            // Load saved settings
            DashboardDemo.storage.loadSettings();
            
            // Apply dark mode if enabled
            if (DashboardDemo.settings.darkMode) {
                document.body.classList.add('dark-mode');
            }
            
            // Add basic chart styles
            this.addChartStyles();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Render initial charts
            this.charts.renderRevenueChart();
            this.charts.renderSalesChart();
        },
        
        // Add chart styles
        addChartStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .chart-container {
                    width: 100%;
                    height: 250px;
                    display: flex;
                    flex-direction: column;
                }
                
                .chart-legend {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                
                .chart-label {
                    display: inline-block;
                    margin: 0 10px;
                    font-size: 12px;
                    color: #6c757d;
                }
                
                .chart-bars {
                    display: flex;
                    justify-content: space-around;
                    align-items: flex-end;
                    height: 220px;
                }
                
                .chart-bar-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 30px;
                }
                
                .chart-bar {
                    width: 30px;
                    background-color: #4e73df;
                    border-radius: 4px 4px 0 0;
                    transition: height 0.5s ease;
                }
                
                .chart-value {
                    margin-top: 5px;
                    font-size: 12px;
                    color: #6c757d;
                }
                
                /* Pie Chart Styles */
                .pie-chart-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 250px;
                }
                
                .pie-chart {
                    position: relative;
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: #e0e0e0;
                }
                
                .pie-segment {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    transform-origin: 50% 50%;
                    background: var(--color);
                    clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%);
                    transform: rotate(var(--start));
                    z-index: calc(1 + var(--start));
                }
                
                .pie-segment::before {
                    content: '';
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: inherit;
                    transform-origin: 50% 50%;
                    transform: rotate(calc(var(--end) - var(--start)));
                }
                
                .pie-legend {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-left: 20px;
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    font-size: 12px;
                }
                
                .legend-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                    margin-right: 5px;
                }
                
                .legend-label {
                    margin-right: 5px;
                    color: #333;
                }
                
                .legend-value {
                    font-weight: bold;
                    color: #333;
                }
                
                /* Dark mode support */
                body.dark-mode .chart-label,
                body.dark-mode .chart-value,
                body.dark-mode .legend-label,
                body.dark-mode .legend-value {
                    color: #a3aed0;
                }
                
                /* Button styles */
                .dashboard-button {
                    position: fixed;
                    bottom: 20px;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background-color: #4e73df;
                    color: white;
                }
                
                .dashboard-button:hover {
                    background-color: #3756c5;
                }
                
                #darkModeToggle {
                    right: 20px;
                }
                
                #refreshButton {
                    right: 160px;
                }
                
                /* Notification style */
                .dashboard-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    background-color: #4e73df;
                    color: white;
                    border-radius: 5px;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                    z-index: 9999;
                    max-width: 300px;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: all 0.3s ease;
                }
                
                .dashboard-notification.show {
                    opacity: 1;
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(style);
        },
        
        // Setup event listeners
        setupEventListeners() {
            // Time range selector
            const timeSelector = document.querySelector('select');
            if (timeSelector) {
                // Set initial value
                timeSelector.value = DashboardDemo.settings.timeRange;
                
                timeSelector.addEventListener('change', function() {
                    DashboardDemo.settings.timeRange = this.value;
                    DashboardDemo.storage.saveSettings();
                    DashboardDemo.ui.charts.renderRevenueChart();
                    DashboardDemo.ui.showNotification('Time range updated');
                });
            }
            
            // Sales view selector
            const salesSelector = document.querySelectorAll('select')[1];
            if (salesSelector) {
                // Set initial value
                salesSelector.value = DashboardDemo.settings.salesView;
                
                salesSelector.addEventListener('change', function() {
                    DashboardDemo.settings.salesView = this.value;
                    DashboardDemo.storage.saveSettings();
                    DashboardDemo.ui.charts.renderSalesChart();
                    DashboardDemo.ui.showNotification('Sales view updated');
                });
            }
            
            // Add dark mode toggle button
            this.addButtons();
            
            // Add refresh functionality to the refresh button
            const refreshButton = document.querySelector('.btn:contains("Refresh")');
            if (refreshButton) {
                refreshButton.addEventListener('click', function() {
                    DashboardDemo.ui.refreshData();
                });
            }
        },
        
        // Add buttons to the UI
        addButtons() {
            // Dark mode toggle
            const darkModeToggle = document.createElement('button');
            darkModeToggle.id = 'darkModeToggle';
            darkModeToggle.className = 'dashboard-button';
            darkModeToggle.textContent = DashboardDemo.settings.darkMode ? 'Light Mode' : 'Dark Mode';
            
            darkModeToggle.addEventListener('click', function() {
                DashboardDemo.settings.darkMode = !DashboardDemo.settings.darkMode;
                DashboardDemo.storage.saveSettings();
                
                if (DashboardDemo.settings.darkMode) {
                    document.body.classList.add('dark-mode');
                    this.textContent = 'Light Mode';
                } else {
                    document.body.classList.remove('dark-mode');
                    this.textContent = 'Dark Mode';
                }
                
                DashboardDemo.ui.showNotification(`${DashboardDemo.settings.darkMode ? 'Dark' : 'Light'} mode enabled`);
            });
            
            document.body.appendChild(darkModeToggle);
            
            // Refresh button
            const refreshButton = document.createElement('button');
            refreshButton.id = 'refreshButton';
            refreshButton.className = 'dashboard-button';
            refreshButton.textContent = 'Refresh Data';
            
            refreshButton.addEventListener('click', function() {
                DashboardDemo.ui.refreshData();
            });
            
            document.body.appendChild(refreshButton);
        },
        
        // Show notification
        showNotification(message) {
            // Create or get notification element
            let notification = document.getElementById('dashboard-notification');
            
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'dashboard-notification';
                notification.className = 'dashboard-notification';
                document.body.appendChild(notification);
            }
            
            // Set message
            notification.textContent = message;
            
            // Show notification
            notification.classList.add('show');
            
            // Hide after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        },
        
        // Refresh data
        refreshData() {
            // Simulate data refresh with simple random changes
            const randomPercent = () => (Math.random() * 0.1) + 0.95; // 95-105%
            
            // Update revenue data
            DashboardDemo.data.revenue.daily = DashboardDemo.data.revenue.daily.map(val => Math.round(val * randomPercent()));
            DashboardDemo.data.revenue.weekly = DashboardDemo.data.revenue.weekly.map(val => Math.round(val * randomPercent()));
            DashboardDemo.data.revenue.monthly = DashboardDemo.data.revenue.monthly.map(val => Math.round(val * randomPercent()));
            
            // Update KPIs
            DashboardDemo.data.kpi.totalRevenue.value = Math.round(DashboardDemo.data.kpi.totalRevenue.value * randomPercent());
            DashboardDemo.data.kpi.newCustomers.value = Math.round(DashboardDemo.data.kpi.newCustomers.value * randomPercent());
            DashboardDemo.data.kpi.totalOrders.value = Math.round(DashboardDemo.data.kpi.totalOrders.value * randomPercent());
            
            // Slightly change sales distribution
            DashboardDemo.data.sales.byCategory.forEach(item => {
                item.value = Math.round(item.value * randomPercent());
            });
            
            // Normalize sales distribution to 100%
            const normalizeDistribution = (distribution) => {
                const total = distribution.reduce((sum, item) => sum + item.value, 0);
                distribution.forEach(item => {
                    item.value = Math.round((item.value / total) * 100);
                });
                
                // Make sure they sum to 100%
                const newTotal = distribution.reduce((sum, item) => sum + item.value, 0);
                if (newTotal !== 100) {
                    distribution[0].value += (100 - newTotal);
                }
            };
            
            normalizeDistribution(DashboardDemo.data.sales.byCategory);
            normalizeDistribution(DashboardDemo.data.sales.byRegion);
            normalizeDistribution(DashboardDemo.data.sales.byChannel);
            
            // Update card values
            const updateCardValues = () => {
                const cards = document.querySelectorAll('.card-value');
                if (cards.length >= 4) {
                    cards[0].textContent = `$${DashboardDemo.data.kpi.totalRevenue.value.toLocaleString()}`;
                    cards[1].textContent = DashboardDemo.data.kpi.newCustomers.value.toLocaleString();
                    cards[2].textContent = DashboardDemo.data.kpi.totalOrders.value.toLocaleString();
                    cards[3].textContent = `${DashboardDemo.data.kpi.returnRate.value}%`;
                }
            };
            
            // Re-render charts
            this.charts.renderRevenueChart();
            this.charts.renderSalesChart();
            updateCardValues();
            
            // Show notification
            this.showNotification('Data refreshed successfully');
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure the DOM is fully loaded
    setTimeout(() => {
        DashboardDemo.ui.init();
    }, 100);
});