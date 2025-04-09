const svg = d3.select("#map");
const barSvg = d3.select("#barchart");
const tooltip = d3.select(".tooltip");
const pieContainer = d3.select("#piechart");

const projection = d3.geoAlbersUsa()
  .translate([960 / 2, 600 / 2])
  .scale(1000);

const path = d3.geoPath().projection(projection);

let barData = {};
let pieData = {};

// Load bar data
d3.csv("bar_allergy_data.csv").then(barCsv => {
  barCsv.forEach(d => {
    barData[d.State] = {
      Egg: +d.Eggs,
      Dairy: +d.Diary,
      Peanuts: +d.Peanuts,
      Seafood: +d.Seafood,
      Additives: +d.Additives,
      Other: +d.Other
    };
  });

  // Load pie data
  d3.csv("pie_allergy_data.csv").then(pieCsv => {
    pieCsv.forEach(d => {
      pieData[d.State] = {
        Eggs: +d.Eggs,
        Peanuts: +d.Peanuts,
        Shellfish: +d.Shellfish,
        Seeds: +d.Seeds,
        Other: +d.Other
      };
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
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(d.properties.name)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", (event, d) => {
          const stateName = d.properties.name;
          if (barData[stateName]) drawBarChart(stateName, barData[stateName]);
          if (pieData[stateName]) drawPieChart(stateName, pieData[stateName]);
        });
    });
  });
});

// Bar chart
function drawBarChart(state, data) {
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const width = 500 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  barSvg.selectAll("*").remove();
  const g = barSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const keys = Object.keys(data);
  const values = Object.values(data);

  const x = d3.scaleBand().domain(keys).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(values)]).nice().range([height, 0]);

  g.selectAll("rect")
    .data(keys)
    .enter()
    .append("rect")
    .attr("x", d => x(d))
    .attr("y", d => y(data[d]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(data[d]))
    .attr("fill", "steelblue");

  g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));

  barSvg.append("text")
    .attr("x", width / 2 + margin.left)
    .attr("y", margin.top)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text(`Food Allergy (Bar) in ${state}`);
}

// Pie chart
function drawPieChart(state, data) {
  pieContainer.selectAll("*").remove();

  const width = 300;
  const height = 300;
  const radius = Math.min(width, height) / 2;

  const svg = pieContainer.append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const color = d3.scaleOrdinal()
    .domain(Object.keys(data))
    .range(d3.schemeCategory10);

  const pie = d3.pie()
    .sort(null)
    .value(d => d[1]);

  const data_ready = pie(Object.entries(data));
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  const tooltip = d3.select(".tooltip");

  svg.selectAll("path")
    .data(data_ready)
    .join("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data[0]))
    .attr("stroke", "#fff")
    .style("stroke-width", "2px")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`${d.data[0]}: ${(d.data[1] * 100).toFixed(2)}%`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  pieContainer.append("h3").text(`Top 5 Food Allergy substance in ${state}`);
}
