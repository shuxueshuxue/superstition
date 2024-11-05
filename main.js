const obsidian = require('obsidian');

class Superstition extends obsidian.Plugin {
    async onload() {
        // Load saved data
        const savedData = await this.loadData();
        this.activities = savedData || {};

        // Add settings tab
        this.addSettingTab(new SuperstitionSettingTab(this.app, this));

        // Register view type
        this.registerView(
            'superstition',
            (leaf) => (this.view = new SuperstitionView(leaf, this))
        );

        // Add ribbon icon
        this.addRibbonIcon('calendar', 'Superstition', () => {
            this.activateView();
        });

        // Add command to show today's routines
        this.addCommand({
            id: 'show-today-routines',
            name: 'Show today\'s routines',
            callback: () => this.showTodayRoutines()
        });

        // Ensure view is activated when plugin loads
        this.app.workspace.onLayoutReady(() => {
            if (!this.app.workspace.getLeavesOfType('superstition').length) {
                this.activateView();
            }
        });

        // Log loaded data for debugging
        // console.log('Loaded activities:', this.activities);
    }

    async onunload() {
    }

    async activateView() {
        const { workspace } = this.app;
        
        let leaf = workspace.getRightLeaf(false);
        await leaf.setViewState({
            type: 'superstition',
            active: true,
        });
        
        workspace.revealLeaf(leaf);
    }

    async saveActivities() {
        await this.saveData(this.activities);
        // console.log('Saved activities:', this.activities);
        // Update the view when activities are saved
        if (this.view) {
            this.view.updateView();
        }
    }

    isActivityRecommended(activity) {
        const today = new Date();
        const startDate = new Date(this.activities[activity].startDate);
        const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        return daysDiff % this.activities[activity].period === 0;
    }

    async showTodayRoutines() {
        const modal = new obsidian.Modal(this.app);
        modal.contentEl.appendChild(this.createRoutineElement());
        modal.open();
    }

    createRoutineElement() {
        const container = document.createElement('div');
        container.addClass('superstition-container');
        
        const recommended = [];
        const notRecommended = [];

        for (const activity in this.activities) {
            if (this.isActivityRecommended(activity)) {
                recommended.push(activity);
            } else {
                notRecommended.push(activity);
            }
        }

        container.createEl("h2", { text: "Today's routines" });
        
        const yiDiv = container.createDiv();
        yiDiv.createEl("h3", { text: "宜 (Suitable)" });
        recommended.forEach(activity => {
            yiDiv.createEl("div", { text: `• ${activity}` });
        });

        const jiDiv = container.createDiv();
        jiDiv.createEl("h3", { text: "忌 (Unsuitable)" });
        notRecommended.forEach(activity => {
            jiDiv.createEl("div", { text: `• ${activity}` });
        });

        return container;
    }
}

class SuperstitionView extends obsidian.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.icon = 'dice'; // Change the icon to dice
    }

    getViewType() {
        return 'superstition';
    }

    getDisplayText() {
        return 'Superstition';
    }

    getIcon() {
        return this.icon;
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.addClass('superstition-content');
        this.updateView();
    }

    updateView() {
        const container = this.containerEl.children[1];
        container.empty();
        container.appendChild(this.plugin.createRoutineElement());
    }
}

class SuperstitionSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const {containerEl} = this;
        containerEl.empty();

        // Add new activity section
        new obsidian.Setting(containerEl)
            .setName("Add New Activity")
            .addText(text => text
                .setPlaceholder("Activity name")
                .setValue("")
                .onChange(async (value) => {
                    this.newActivityName = value;
                }))
            .addText(text => text
                .setPlaceholder("Period (days)")
                .setValue("")
                .onChange(async (value) => {
                    this.newActivityPeriod = parseInt(value);
                }))
            .addButton(button => button
                .setButtonText("Add")
                .onClick(async () => {
                    if (this.newActivityName && this.newActivityPeriod) {
                        this.plugin.activities[this.newActivityName] = {
                            period: this.newActivityPeriod,
                            startDate: new Date().toISOString()
                        };
                        await this.plugin.saveActivities();
                        this.display();
                    }
                }));

        // List existing activities
        for (const activity in this.plugin.activities) {
            new obsidian.Setting(containerEl)
                .setName(activity)
                .setDesc(`Period: ${this.plugin.activities[activity].period} days`)
                .addButton(button => button
                    .setButtonText("Delete")
                    .onClick(async () => {
                        delete this.plugin.activities[activity];
                        await this.plugin.saveActivities();
                        this.display();
                    }));
        }
    }
}


// Add styles to document
// const styleElement = document.createElement('style');
// styleElement.textContent = styles;
// document.head.appendChild(styleElement);

module.exports = Superstition;
