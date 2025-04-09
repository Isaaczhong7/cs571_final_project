const width = 1000;
const height = 500;

const svg = d3.select("svg");
const tooltip = d3.select(".tooltip");

const projection = d3.geoAlbersUsa()
  .translate([width / 2, height / 2])
  .scale(1000);

const path = d3.geoPath().projection(projection);

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
      alert("This is : " + d.properties.name);
    });
});