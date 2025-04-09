const svg = d3.select("#map");
const barSvg = d3.select("#barchart");
const tooltip = d3.select(".tooltip");
const pieContainer = d3.select("#piechart");

const projection = d3.geoAlbersUsa()
  .translate([1100 / 2, 600 / 2])
  .scale(1400);

const colorScale = d3.scaleLinear()
  .domain([45, 70, 100])  // we can adjust the domain based on the number of cites/scores
  .range(["#1a9850", "#f7590a","#e6261c"]);  // red → orange → green


const path = d3.geoPath().projection(projection);

let barData = {};
let pieData = {};

// Load bar data
d3.csv("../dataset/bar_allergy_data.csv").then(barCsv => {
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
  d3.csv("../dataset/pie_allergy_data.csv").then(pieCsv => {
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

// Load city allergy scores with coordinates
d3.csv("../dataset/total_pollen_score_ranking.csv").then(cityData => {
  cityData.forEach(d => {
    d.Score = +d.Score;
    d.Rank = +d.Rank;
    d.Lat = +d.Lat;
    d.Lon = +d.Lon;
  });

  // Append city circles after map is drawn
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

    // Draw circles for cities
    svg.selectAll("circle.city")
      .data(cityData)
      .enter()
      .append("circle")
      .attr("class", "city")
      .attr("cx", d => {
        const coords = projection([d.Lon, d.Lat]);
        return coords ? coords[0] : null;
      })
      .attr("cy", d => {
        const coords = projection([d.Lon, d.Lat]);
        return coords ? coords[1] : null;
      })
      .attr("r", 5)
      .attr("fill", d => colorScale(d.Score))
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(
          `<strong>${d.City}, ${d.State}</strong><br>
           Rank: ${d.Rank}<br>
           Total Pollen Score: ${d.Score}`
        )
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });
      drawLegend();
  });
});
function drawLegend() {
  const legendWidth = 300;
  const legendHeight = 10;
  const legendContainer = d3.select("#legendContainer");

  const legendSvg = legendContainer
    .append("svg")
    .attr("width", legendWidth + 100)
    .attr("height", 70)
    .style("margin-top", "10px");

  // Title
  legendSvg.append("text")
    .attr("x", (legendWidth + 100) / 2)
    .attr("y", 15)
    .text("Total Pollen Score")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("text-anchor", "middle");

  // Gradient
  const defs = legendSvg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient");

  linearGradient.selectAll("stop")
    .data([
      { offset: "0%", color: "#e6261c" },  // Better
      { offset: "50%", color: "#f7590a" }, // Average
      { offset: "100%", color: "#1a9850" } // Worse
    ])
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  // Gradient bar
  legendSvg.append("rect")
    .attr("x", 50)
    .attr("y", 30)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  // Labels
  legendSvg.append("text")
    .attr("x", 40)
    .attr("y", 28)
    .text("Worse")
    .style("fill", "#d73027")
    .style("font-size", "12px");

  legendSvg.append("text")
    .attr("x", legendWidth / 2 + 50)
    .attr("y", 28)
    .text("Average")
    .style("fill", "#fdae61")
    .style("font-size", "12px")
    .style("text-anchor", "middle");

  legendSvg.append("text")
    .attr("x", legendWidth + 60)
    .attr("y", 28)
    .text("Better")
    .style("fill", "#1a9850")
    .style("font-size", "12px");
}



// Bar chart
function drawBarChart(state, data) {
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const width = 500 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;
  const titleContainer = d3.select("#barTitle");
  
  titleContainer.selectAll("*").remove();   

  titleContainer.append("h3")
    .text(`The precentage of Food Allergy with anaphylaxis in ${state}`)
    .style("font-size", "20px")
    .style("text-align", "center")
    .style("margin-bottom", "10px");

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

}

// Pie chart
function drawPieChart(state, data) {
    const pieContainer = d3.select("#piechart");
    const titleContainer = d3.select("#pieTitle");
  
    pieContainer.selectAll("*").remove();       // clear previous chart
    titleContainer.selectAll("*").remove();     // clear previous title
  
    titleContainer.append("h3")
      .text(`Top 5 Food Allergy Substances in ${state}`)
      .style("font-size", "20px")
      .style("text-align", "center")
      .style("margin-bottom", "10px");
  
    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;
  
    const svg = pieContainer
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
  }
  
