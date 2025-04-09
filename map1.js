const width = 960;
const height = 600;

const svg = d3.select("#map");
const barSvg = d3.select("#barchart");
const tooltip = d3.select(".tooltip");

const projection = d3.geoAlbersUsa()
  .translate([width / 2, height / 2])
  .scale(1000);

const path = d3.geoPath().projection(projection);

let allergyData = {};

// Load allergy CSV
d3.csv("us_food_allergy.csv").then(data => {
  data.forEach(d => {
    allergyData[d.State] = {
      Eggs: +d.Eggs,
      Dairy: +d.Diary,
      Peanuts: +d.Peanuts,
      Seafood: +d.Seafood,
      Additives: +d.Additives,
      Other: +d.Other
    };
  });

    console.log(data)

  // Load US states and render map
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
    const states = topojson.feature(us, us.objects.states).features;

    svg.selectAll("path")
      .data(states)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "state")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "steelblue");
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(d.properties.name)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", null);
        tooltip.transition().duration(500).style("opacity", 0);
      })
      .on("click", (event, d) => {
        const stateName = d.properties.name;
        if (allergyData[stateName]) {
          drawBarChart(stateName, allergyData[stateName]);
        } else {
          console.warn("No data for", stateName);
        }
      });
  });
});

// Draw the bar chart
function drawBarChart(state, data) {
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const width = 500 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  // Clear old chart
  barSvg.selectAll("*").remove();
  const g = barSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const keys = Object.keys(data);
  const values = Object.values(data);

  const x = d3.scaleBand()
    .domain(keys)
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(values)]).nice()
    .range([height, 0]);

  g.append("g")
    .selectAll("rect")
    .data(keys)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d))
    .attr("y", d => y(data[d]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(data[d]));

  // X Axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Y Axis
  g.append("g").call(d3.axisLeft(y));

  // Title
  barSvg.append("text")
    .attr("x", width / 2 + margin.left)
    .attr("y", margin.top - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text(`Food Allergy Stats in ${state}`);
}