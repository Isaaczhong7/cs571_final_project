
const svg = d3.select("#map");
const tooltip = d3.select(".tooltip");

const projection = d3.geoAlbersUsa()
  .translate([960 / 2, 600 / 2])
  .scale(1000);

const path = d3.geoPath().projection(projection);
let ageData = {};

d3.csv("age_groups.csv").then(ageCsv => {
    ageCsv.forEach(d => {
      ageData[d.state] = {
        "Age 0-13": +d.age_0_13,
        "Age 14-40": +d.age_14_40,
        "Age 41-older": +d.age_41_older
      };
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

