const svg = d3.select("#map");
const tooltip = d3.select(".tooltip");

const projection = d3.geoAlbersUsa()
  .translate([1400 / 2, 700 / 2])
  .scale(1400);

const path = d3.geoPath().projection(projection);
let ageData = {};

d3.csv("../dataset/age_groups.csv").then(ageCsv => {
    ageCsv.forEach(d => {
      ageData[d.state] = {
        "Age 0-13": +d.age_0_13,
        "Age 14-40": +d.age_14_40,
        "Age 41-older": +d.age_41_older
      };
    });

    // Create and populate data table
    const tableBody = d3.select("#ageDataTable tbody");
    
    // Convert ageData object to array and sort alphabetically by state name
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

    // Add toggle functionality
    d3.select("#showTableBtn").on("click", function() {
        const tableContainer = d3.select("#dataTableContainer");
        const isVisible = tableContainer.style("display") !== "none";
        
        tableContainer.style("display", isVisible ? "none" : "block");
        d3.select(this).text(isVisible ? "Show Data Table" : "Hide Data Table");
    });
});

// Load the US map
d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
  const states = topojson.feature(us, us.objects.states).features;

  svg.selectAll("path")
    .data(states)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "state")
    .on("mouseover", function (event, d) {
        const stateName = d.properties.name;
        
        if (ageData[stateName]) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`
                <div><strong>${stateName}</strong></div>
                <div>Age 0-13: ${ageData[stateName]["Age 0-13"]}%</div>
                <div>Age 14-40: ${ageData[stateName]["Age 14-40"]}%</div>
                <div>Age 41-older: ${ageData[stateName]["Age 41-older"]}%</div>
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        };
    })
    .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
    });
});

