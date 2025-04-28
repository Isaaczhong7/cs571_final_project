const svg = d3.select("#map");
const tooltip = d3.select(".tooltip");
const pieContainer = d3.select("#piechart");
const barSvg = d3.select("#barchart");
const barTitle = d3.select("#barTitle");
const pollenCheckbox = d3.select("#pollenCheckbox");
const titleContainer = d3.select("#pieTitle");

const projection = d3.geoAlbersUsa()
  .translate([1100 / 2, 600 / 2])
  .scale(1400);

const colorScale = d3.scaleLinear()
  .domain([45, 70, 100])  
  .range(["#1a9850", "#f7590a","#e6261c"]);  


const path = d3.geoPath().projection(projection);

let barData = {};
let pieData = {};
let pollenStateData = {}; 

const legendDiv  = d3.select("#legendContainer");
const regionSel  = d3.select("#regionFilter");
const allergenSel= d3.select("#allergenFilter");  



const missingColor = "#e0e0e0";     // grey for states not in the CSV
const ramp        = d3.interpolateBlues;; // colour ramp (0 → 1)

/* US Census regions for the dropdown */
const regionMap = {
  Northeast: [
    "Maine","New Hampshire","Vermont","Massachusetts",
    "Rhode Island","Connecticut","New York","New Jersey","Pennsylvania"
  ],

  Midwest: [
    "Ohio","Michigan","Indiana","Wisconsin","Illinois","Minnesota",
    "Iowa","Missouri","North Dakota","South Dakota","Nebraska","Kansas"
  ],

  South: [
    "Delaware","Maryland","District of Columbia","Virginia","West Virginia",
    "North Carolina","South Carolina","Georgia","Florida","Kentucky",
    "Tennessee","Mississippi","Alabama","Oklahoma","Texas","Arkansas","Louisiana"
  ],

  West: [
    "Montana","Idaho","Wyoming","Colorado","New Mexico","Arizona",
    "Utah","Nevada","Washington","Oregon","California","Alaska","Hawaii"
  ]
};


Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
  d3.csv("../dataset/pie_allergy_data.csv", d => {
    ["Eggs","Peanuts","Shellfish","Seeds","Other"].forEach(k => d[k] = +d[k]);
    return d;
  })
]).then(([us, csv]) => {

  /* lookup table:  state → { Eggs:…, Peanuts:…, … } */
  const stateData = Object.fromEntries(csv.map(d => [d.State, d]));

  /* map shapes */
  const states = topojson.feature(us, us.objects.states).features;
  const stateShapes = svg.selectAll("path.state")
    .data(states)
    .enter().append("path")
      .attr("class","state")
      .attr("d", path)
      .on("mouseover", showTooltip)
      .on("mouseout", () => tooltip.transition().duration(500).style("opacity",0))
      .on("click", (evt,d) => {
        const name = d.properties.name;
        const data = stateData[name];
        if (data) { drawBarChart(name,data); drawPieChart(name,data); }
      });

  /* first draw */
  updateChoropleth();
  buildLegend();


  regionSel.on("change",   filterByRegion);
  allergenSel.on("change", () => { updateChoropleth(); buildLegend(); });
  pollenCheckbox.on("change", () => { updateChoropleth(); buildLegend(); });

  // function updateChoropleth(){
  //   const allergen = allergenSel.property("value");          
  //   const maxVal   = d3.max(csv, d => d[allergen]);
  //   const color = d3.scaleSequential([0,maxVal], ramp);

  //   stateShapes
  //     .attr("fill", d => {
  //       const row = stateData[d.properties.name];
  //       return row ? color(row[allergen]) : missingColor;
  //     });
  // }

  function updateChoropleth() {
    const usePollen = pollenCheckbox.property("checked");
    const allergen  = allergenSel.property("value");
  
    if (usePollen) {
      const maxVal = d3.max(Object.values(pollenStateData));
      const color = d3.scaleSequential([0, maxVal], ramp);
  
      stateShapes.attr("fill", d => {
        const score = pollenStateData[d.properties.name];
        return score !== undefined ? color(score) : missingColor;
      });
  
    } else {
      const maxVal = d3.max(csv, d => d[allergen]);
      const color = d3.scaleSequential([0, maxVal], ramp);
  
      stateShapes.attr("fill", d => {
        const row = stateData[d.properties.name];
        return row ? color(row[allergen]) : missingColor;
      });
    }
  }
  

  function filterByRegion() {
    const choice = this.value;

    barSvg.selectAll("*").remove();
    barTitle.selectAll("*").remove();
    const pieContainer = d3.select("#piechart");
    const titleContainer = d3.select("#pieTitle");
    pieContainer.selectAll("*").remove();       // clear previous chart
    titleContainer.selectAll("*").remove();     // clear previous title
    stateShapes.style("display", d =>
      choice === "all" ||
      (regionMap[choice] && regionMap[choice].includes(d.properties.name))
        ? null
        : "none"
    );
  
    // 🔑  repaint the map & legend in whatever mode (allergen or pollen)
    updateChoropleth();
    buildLegend();
  }
  function showTooltip(event,d){
    const name    = d.properties.name;
    const row     = stateData[name];
    const allergen= allergenSel.property("value");
    tooltip.transition().duration(200).style("opacity",0.9);
    tooltip.html(
      `<strong>${name}</strong><br/>` +
      (row
         ? `${allergen}: ${(row[allergen]*100).toFixed(1)}%`
         : "No data"))
      .style("left", event.pageX+10+"px")
      .style("top",  event.pageY-20+"px");
  }




function buildLegend() {
  legendDiv.selectAll("*").remove();
  const w=260, h=50;
  const svgLeg = legendDiv.append("svg").attr("width",w).attr("height",h);

  const usePollen = pollenCheckbox.property("checked");
  const allergen  = allergenSel.property("value");

  svgLeg.append("text")
    .attr("x", w/2).attr("y", 14)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text(usePollen ? "Pollen Score" : `${allergen} (%)`);

  // const defs = svgLeg.append("defs");
  const lg = svgLeg.append("linearGradient").attr("id", "lg");
  lg.selectAll("stop").data(d3.range(0,1.01,0.1))
    .enter().append("stop")
      .attr("offset", d => d)
      .attr("stop-color", d => ramp(d));
  svgLeg.append("rect")
    .attr("x",20).attr("y",22).attr("width",200).attr("height",10)
    .attr("fill","url(#lg)");

  const maxVal = usePollen
    ? d3.max(Object.values(pollenStateData))
    : d3.max(csv, d => d[allergen]);

  const scale = d3.scaleLinear().domain([0, maxVal]).range([20,220]);
  svgLeg.selectAll("text.tick")
    .data([0, maxVal/2, maxVal])
    .enter().append("text")
      .attr("class", "tick")
      .attr("x", d => scale(d)).attr("y", 45)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text(d => usePollen ? d.toFixed(0) : (d*100).toFixed(0) + "%");
}
});


// Load city allergy scores with coordinates
d3.csv("../dataset/total_pollen_score_ranking.csv").then(cityData => {
  cityData.forEach(d => {
    d.Score = +d.Score;
    d.Rank = +d.Rank;
    d.Lat = +d.Lat;
    d.Lon = +d.Lon;
  });

// Group cities by State
const grouped = d3.group(cityData, d => d.State);

// Calculate average pollen score per state
grouped.forEach((cities, state) => {
  pollenStateData[state] = d3.mean(cities, d => d.Score);
});

// Now pollenStateData is ready for choropleth
const regionPollenData = {};     // { Midwest: …, South: …, … }

for (const [region, states] of Object.entries(regionMap)) {
  // take only the states that have pollen data
  const withData = states.filter(s => pollenStateData[s] !== undefined);
  regionPollenData[region] = d3.mean(withData, s => pollenStateData[s]);
}

updateChoropleth();
buildLegend();

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


function drawBarChart(state, data) {

  barSvg.selectAll("*").remove(); // remove previous bar chart
  barTitle.selectAll("*").remove(); // remove previous bar chart title
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const width  = 500 - margin.left - margin.right;
  const height = 300 - margin.top  - margin.bottom;

  // ── keep only numeric allergen columns
  const keys   = ["Eggs","Peanuts","Shellfish","Seeds","Other"];
  const values = keys.map(k => data[k]);          // numeric array

  /* rest of your function stays unchanged, but tweak the scales */
  const x = d3.scaleBand().domain(keys).range([0, width]).padding(0.25);
  const y = d3.scaleLinear()
              .domain([0, d3.max(values)]).nice()
              .range([height, 0]);

  /* redraw as before … */

  d3.select("#barTitle").html(
    `<h3>The precentage of food allergy group with anaphylaxis in ${state}</h3>`);

  const g = barSvg.append("g")
                  .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g")
 .call(d3.axisLeft(y).tickFormat(d3.format(".0%"))); 
  g.append("g").attr("transform", `translate(0,${height})`)
               .call(d3.axisBottom(x));

  g.selectAll("rect")
    .data(keys)
    .enter().append("rect")
      .attr("x", d => x(d))
      .attr("y", d => y(data[d]))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(data[d]))
      .attr("fill", "#69b3a2")
    .append("title")
      .text(d => (data[d] * 100).toFixed(1) + "%");
}

// Pie chart
function drawPieChart(state, data) {
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

