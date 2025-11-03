document.addEventListener("DOMContentLoaded", () => {
    // Switching between charts
    const gridViewBtn = document.getElementById("gridViewBtn");
    const pieViewBtn = document.getElementById("pieViewBtn");
    const gridView = document.getElementById("gridView");
    const pieView = document.getElementById("pieView");
    
    gridViewBtn.addEventListener("click", () => {
        pieView.classList.add("hidden");
        pieViewBtn.classList.remove("active");

        gridView.classList.remove("hidden");
        gridViewBtn.classList.add("active");
    });
    
    pieViewBtn.addEventListener("click", () => {
        gridView.classList.add("hidden");
        gridViewBtn.classList.remove("active");

        pieView.classList.remove("hidden");
        pieViewBtn.classList.add("active");

        if (typeof renderPieChart === "function" && window.latestResults) {
            renderPieChart(window.latestResults, window.latestMonthsLeft);
        }
    });

    // Constants
    const life_expectancy = 90 * 12;
    const grid = document.getElementById("monthsGrid");
    const activitiesDiv = document.getElementById("activities");
    let pieChart = null;

    // Creating the month grid
    grid.innerHTML = "";
    for (let i = 0; i < life_expectancy; i++) {
        const div = document.createElement("div");
        div.className = "month";
        grid.appendChild(div);
    }

    // Configuring the first set of numeric fields
    const firstActivity = document.querySelector(".activity");
    if (firstActivity) {
      setupHourFields(firstActivity);
      document.querySelector(".remove-btn").addEventListener("click", () => clearCels(firstActivity));
    }

    // Clearing the values in the first field
    function clearCels(activityDiv) {
        activityDiv.querySelectorAll('input[type="text"], input[type="number"]').forEach(f => {
            f.value = "";
            f.disabled = false;
        });
        activityDiv.querySelector('input[type="color"]').value = "#a8c8ff";
    }

    // Buttons
    document.getElementById("addActivity").addEventListener("click", addActivity);
    document.getElementById("calcBtn").addEventListener("click", calculateLife);

    // Adding a new activity
    function addActivity() {
        const div = document.createElement("div");
        div.className = "activity";
        div.innerHTML = `
            <input type="text" placeholder="Name" required>
            <input type="number" placeholder="Day" min="0" max="24">
            <input type="number" placeholder="Week" min="0" max="168">
            <input type="number" placeholder="Month" min="0" max="720">
            <input type="color">
            <button class="remove-btn">x</button>
        `;
        div.querySelector(".remove-btn").addEventListener("click", () => div.remove());
        randomizeColor(div);
        setupHourFields(div);

        activitiesDiv.appendChild(div);
    }

    // Checking and blocking the other fields
    function setupHourFields(activityDiv) {
        const [day, week, month] = activityDiv.querySelectorAll('input[type="number"]');
        const fields = [day, week, month];

        fields.forEach(f => {
            f.addEventListener("input", e => {
                // Checking if the input value is below the limit
                const max = parseFloat(e.target.max);
                if (parseFloat(e.target.value) > max) {
                    e.target.value = max;
                };

                // Blocking other fields
                if (e.target.value) {
                    fields.filter(x => x !== e.target).forEach(x => (x.disabled = true));
                } else {
                    fields.forEach(x => (x.disabled = false));
                }
            });
        });
    }

    // Creating a random color for the activity
    function randomizeColor(activityDiv) {
        const colorInput = activityDiv.querySelector('input[type="color"]');
        const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
        colorInput.value = randomColor;
    }

    function calculateLife() {
        // Verifying date of birth
        const birthday = document.getElementById("birthday").value;
        if (!birthday) {
            alert("Please enter your birthday.");
            return;
        }

        // Checking activities
        const activities = [];
        const activitiesDivs = document.querySelectorAll(".activity");

        for (const div of activitiesDivs) {
            const name = div.children[0].value.trim();
            const day = parseFloat(div.children[1].value) || 0;
            const week = parseFloat(div.children[2].value) || 0;
            const month = parseFloat(div.children[3].value) || 0;
            const color = div.children[4].value;

            // Checking if activities have names
            if (!name) {
                alert("Please enter a name for all activities.");
                return;
            }

            // Checking time values
            const filled = [day, week, month].filter(v => v > 0);
            if (filled.length === 0) {
                alert(`Please enter at least one time value for activity: ${name}`);
                return;
            }
            if (filled.length > 1) {
                alert(`Please fill only one time value for activity: ${name}`);
                return;
            }

            // Converting to daily hours
            let hours = 0;
            if (day) hours = day;
            else if (week) hours = week / 7;
            else if (month) hours = month / 30;

            // Adding the activity to the list of activities
            activities.push({ name, hours, color });
        }

        // Checking that the total number of hours does not exceed 24 hours per day
        const totalHours = activities.reduce((sum, act) => sum + act.hours, 0);
        if (totalHours > 24) {
            alert(`The total daily hours of all activities exceed 24 hours. Total sum: ${totalHours.toFixed(1)} h/day.`);
            return;
        }

        // Capturing the data
        const birthdayDate = new Date(birthday);
        const today = new Date();
        const ageMonths = Math.floor((today - birthdayDate) / (1000 * 60 * 60 * 24 * 30.44));
        const monthsLeft = Math.max(life_expectancy - ageMonths, 0);

        // Calculating the percentage per activity
        const results = activities.map(act => {
            const hours = parseFloat(act.hours);
            const proportion =  hours / 24;
            
            return {
                name: act.name,
                color: act.color,
                months: Math.round(monthsLeft * proportion),
                percent: parseFloat((proportion * 100).toFixed(1)) // porcentagem
            };
        });
        
        // Rendering the grid
        window.latestResults = results;
        window.latestMonthsLeft = monthsLeft;

        document.getElementById("gridTitle").classList.remove("hidden");
        document.getElementById("pieTitle").classList.remove("hidden");

        renderGrid(results, ageMonths);
        renderPieChart(results, monthsLeft)
    }

    // Rendering the grid
    function renderGrid(activities, ageMonths) {
        const months = document.querySelectorAll(".month");

        // Resetting the grid
        months.forEach(m => {
            m.style.background = "#e0e0e0";
            m.textContent = "";
            m.title = "";
        });

        // Filling the months lived
        for (let i = 0; i < ageMonths; i++) {
            months[i].style.background = "#b0b0b0";
            months[i].textContent = "•";
        }

        // Filling in the remaining months
        let index = ageMonths;
        activities.forEach(act => {
            for (let i = 0; i < act.months && index < months.length; i++) {
                months[index].style.background = act.color;
                months[index].title = `${act.name} - ${act.percent}% - ${act.months} months`;
                index++;
            }
        });  

        // Legend
        const legend = document.getElementById("legend");
        legend.innerHTML = "";

        // Months lived
        const lived = document.createElement("div");
        lived.className = "legend-item";
        lived.innerHTML = `<div class='legend-color lived-color' style='background-color: #b0b0b0;'></div> Lived Months: ${ageMonths}`;
        legend.appendChild(lived);

        // Activities
        activities.forEach(act => {
            const item = document.createElement("div");
            item.className = "legend-item";
            item.innerHTML = `<div class='legend-color' style='background-color: ${act.color}'></div> ${act.name}: ${act.months}`;
            legend.appendChild(item);
        });

        // Others
        const totalMonths = months.length;
        const usedMonths = activities.reduce((sum, act) => sum + act.months, 0);
        const emptyMonths = Math.max(totalMonths - ageMonths - usedMonths, 0);

        const others = document.createElement("div");
        others.className = "legend-item";
        others.innerHTML = `<div class='legend-color' style='background-color: #e0e0e0;'></div> Others: ${emptyMonths}`;
        legend.appendChild(others);
    }

    // Creating a pie chart with the data
    function renderPieChart(activities, monthsLeft) {
        const ctx = document.getElementById("pieChart").getContext("2d");

        if (pieChart) {
            pieChart.destroy();
        }

        // Obtaining the remaining months
        const usedMonths = activities.reduce((sum, act) => sum + act.months, 0);
        const usedPercent = activities.reduce((sum, act) => sum + act.percent, 0);
        const emptyMonths = Math.max(monthsLeft - usedMonths, 0);
        const emptyPercent = Math.max(100 - usedPercent, 0);

        // Assembling the data
        const labels = activities.map(act => `${act.name}: ${(act.percent).toFixed(2)}%`);
        const dataValues = activities.map(act => parseFloat(act.percent));
        const colors = activities.map(act => act.color);

        if (emptyMonths > 0) {
            labels.push(`Others: ${emptyPercent}%`);
            dataValues.push(Math.round((emptyMonths / monthsLeft * 100) * 100) / 100);
            colors.push("#e0e0e0");
        }

        pieChart = new Chart(ctx, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: colors,
                }]
            },
            options: {
                plugins: {
                    tooltip: {
                        enabled: false
                    },
                    legend: {
                        display: true,
                        position: "bottom",
                        labels: {
                            color: "#f1f1f1",
                            padding: 20
                        }
                    },
                    houver: {
                        mode: null
                    }
                }
            }
        });
    }

});
