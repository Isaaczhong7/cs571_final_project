const svg = d3.select("#map");
const tooltip = d3.select(".tooltip");
let activeAgeGroup = null;
let colorScales = {};
let ageData = {};

// Set up projection and path
const projection = d3.geoAlbersUsa()
  .translate([1400 / 2, 700 / 2])
  .scale(1400);

const path = d3.geoPath().projection(projection);

// Load data and initialize
Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
  d3.csv("../dataset/age_groups.csv")
]).then(([data, ageCsv]) => {
    ageCsv.forEach(d => {
        ageData[d.state] = {
            "Age 0-13": +d.age_0_13,
            "Age 14-40": +d.age_14_40,
            "Age 41-older": +d.age_41_older
        };
    });

    // Create color scales
    const ageGroups = ["Age 0-13", "Age 14-40", "Age 41-older"];
    ageGroups.forEach(group => {
    const values = Object.values(ageData).map(d => d[group]);
    colorScales[group] = d3.scaleLinear()
        .domain([d3.min(values), d3.max(values)])
        .range(
            group === "Age 0-13" ? ["#deebf7", "#08306b"] :
            group === "Age 14-40" ? ["#fee0d2", "#67000d"] :
            ["#e5f5e0", "#00441b"]
        );
    });

    // Draw map
    const states = topojson.feature(data, data.objects.states).features;

    svg.selectAll("path")
       .data(states)
       .enter()
       .append("path")
       .attr("d", path)
       .attr("class", "state")
       .style("fill", "#979696")
       .on("mouseover", function(event, d) {
            const stateName = d.properties.name;

            if (ageData[stateName]) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`
                    <div><strong>${stateName}</strong></div>
                    ${ageGroups.map(g => `
                    <div>${g}: ${ageData[stateName][g]}%</div>
                    `).join('')}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        }
    })
    .on("mouseout", function() {
        tooltip.transition().duration(500).style("opacity", 0);
    });

    function updateMapColors(ageGroup) {
        svg.selectAll(".state")
           .transition()
           .duration(300)
           .style("fill", d => {
                const stateName = d.properties.name;
                return ageData[stateName] ? colorScales[ageGroup](ageData[stateName][ageGroup]) : "#979696";
           })

        svg.selectAll("path")
           .on("mouseover", function(event, d) {
                const stateName = d.properties.name;

                if (ageData[stateName]) {
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(`
                        <div><strong>${stateName}</strong></div>
                        ${`
                        <div>${ageGroup}: ${ageData[stateName][ageGroup]}%</div>
                        `}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
                }
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
            });
    }

    function resetMapColors() {
        svg.selectAll(".state")
            .transition()
            .duration(300)
            .style("fill", "#979696");

        svg.selectAll("path")
            .on("mouseover", function(event, d) {
                 const stateName = d.properties.name;
     
                 if (ageData[stateName]) {
                     tooltip.transition().duration(200).style("opacity", 0.9);
                     tooltip.html(`
                         <div><strong>${stateName}</strong></div>
                         ${ageGroups.map(g => `
                         <div>${g}: ${ageData[stateName][g]}%</div>
                         `).join('')}
                 `)
                 .style("left", (event.pageX + 10) + "px")
                 .style("top", (event.pageY - 20) + "px");
             }
         })
         .on("mouseout", function() {
             tooltip.transition().duration(500).style("opacity", 0);
         });
    }

    // Add button handlers
    d3.selectAll(".age-btn").on("click", function() {
        const clicked = d3.select(this);
        const ageGroup = clicked.attr("data-age");
        const isActive = clicked.classed("active");

        d3.selectAll(".age-btn").classed("active", false);

        if (!isActive) {
            clicked.classed("active", true);
            activeAgeGroup = ageGroup;
            updateMapColors(ageGroup);
        } else {
            activeAgeGroup = null;
            resetMapColors();
        }
    });

    // Initialize data table
    const tableBody = d3.select("#ageDataTable tbody");
    const tableData = Object.entries(ageData)
                            .map(([state, values]) => ({ state, ...values }))
                            .sort((a, b) => a.state.localeCompare(b.state));

    tableBody.selectAll("tr")
             .data(tableData)
             .enter()
             .append("tr")
             .html(d => `
                    <td>${d.state}</td>
                    <td>${d["Age 0-13"]}%</td>
                    <td>${d["Age 14-40"]}%</td>
                    <td>${d["Age 41-older"]}%</td>
                 `);

    // Table toggle
    d3.select("#showTableBtn").on("click", function() {
        const tableContainer = d3.select("#dataTableContainer");
        const isVisible = tableContainer.style("display") !== "none";
        tableContainer.style("display", isVisible ? "none" : "block");
        d3.select(this).text(isVisible ? "Show Data Table" : "Hide Data Table");
    });
});
