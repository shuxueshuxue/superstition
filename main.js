
const obsidian = require('obsidian');

class RoutineCalendar extends obsidian.Plugin {
    async onload() {
        // Load saved data
        const savedData = await this.loadData();
        this.activities = savedData || {};

        // Add settings tab
        this.addSettingTab(new RoutineCalendarSettingTab(this.app, this));

        // Add command to show today's routines
        this.addCommand({
            id: 'show-today-routines',
            name: 'Show Today\'s Routines',
            callback: () => this.showTodayRoutines()
        });

        // Log loaded data for debugging
        console.log('Loaded activities:', this.activities);
    }

    async saveActivities() {
        await this.saveData(this.activities);
        console.log('Saved activities:', this.activities);
    }

    isActivityRecommended(activity) {
        const today = new Date();
        const startDate = new Date(this.activities[activity].startDate);
        const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        return daysDiff % this.activities[activity].period === 0;
    }

    async showTodayRoutines() {
        const recommended = [];
        const notRecommended = [];

        for (const activity in this.activities) {
            if (this.isActivityRecommended(activity)) {
                recommended.push(activity);
            } else {
                notRecommended.push(activity);
            }
        }

        const modal = new obsidian.Modal(this.app);
        modal.contentEl.createEl("h2", { text: "Today's Routines" });
        
        const yiDiv = modal.contentEl.createDiv();
        yiDiv.createEl("h3", { text: "宜 (Suitable)" });
        recommended.forEach(activity => {
            yiDiv.createEl("div", { text: `• ${activity}` });
        });

        const jiDiv = modal.contentEl.createDiv();
        jiDiv.createEl("h3", { text: "忌 (Unsuitable)" });
        notRecommended.forEach(activity => {
            jiDiv.createEl("div", { text: `• ${activity}` });
        });

        modal.open();
    }
}

class RoutineCalendarSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const {containerEl} = this;
        containerEl.empty();

        containerEl.createEl('h2', {text: 'Routine Calendar Settings'});

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

module.exports = RoutineCalendar;
