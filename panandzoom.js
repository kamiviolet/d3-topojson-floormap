import "./lib/d3.v7.js";
import "./lib/topojson-client.js";

// Declare constants
const canvas = {
    w: 1000,
    h: 1000
};
const zoomScale = {
    min: 1,
    max: 8
}

// Fetch data
const topoData = await d3.json(`./one_bedroom.json`);
const geoData = {};
const arrOfKeys = Object.keys(topoData.objects);
arrOfKeys.forEach(key => {
    geoData[key] = topojson.feature(topoData, key);
})

// D3 geo generator
const d3Identity = d3.geoIdentity();
const d3Projection = d3Identity
    .fitSize([canvas.w, canvas.h], geoData["apartment"]);
const d3Path = d3.geoPath(d3Projection);

// D3 zoom
function configZoom(func) {
    return d3.zoom()
        .filter(filterZoom)
        .scaleExtent([zoomScale.min, zoomScale.max])
        .translateExtent([[0, 0], [canvas.w, canvas.h]])
        .on("zoom", func);
}

function filterZoom(event) {
    return (event.type !== "wheel" && event.type !== "dblclick" );
}

function zoomed(e) {
    const {transform} = e;
    d3.select(".panning-layer").attr("transform", transform);
    d3.select(".panning-layer").attr("stroke-width", 1 / transform.k);
}

function setZoom(e,d) {
    const [[x0, y0], [x1, y1]] = d3Path.bounds(d);
  
    let autoZoomScale =
        Math.min(zoomScale.max, 1 / Math.max((x1 - x0) / canvas.w, (y1 - y0) / canvas.h));
    let zoom = configZoom(zoomed);
    let svg = d3.select("#svg_container > svg");
  
    svg.transition()
        .duration(1000)
        // Method 1: call zoom.transform and pass zoomIdentity
        // So to programmatically set a series of transform to perform
        .call(zoom.transform,
            d3.zoomIdentity
                .translate(canvas.w / 2, canvas.h / 2)
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(e, svg.node()))
        .transition()
        .duration(1000)
        // Method 2: call zoom.scaleBy/To/translateBy/To directly and pass x/y/k
        // To perform the transform a step per time
        .call(zoom.scaleBy, autoZoomScale);

  d3.selectAll('.selectable')
        .classed("zoomed", false);
    d3.select(e.target)
        .classed("zoomed", true);
}

function resetZoom(e) {
    if (e.target.classList.contains("selectable")) return;
  
    let svg = d3.select("#svg_container > svg");
    let zoom = configZoom(zoomed);
  
    d3.selectAll(".selectable")
        .classed("zoomed", false);
    svg.transition()
        .duration(2000)
        .call(zoom.transform, d3.zoomIdentity);
}

// Draw SVG
const svgContainer = d3
    .select("#svg_container")
    .append("svg")
    .attr("viewBox", `0 0 ${canvas.w} ${canvas.h}`)
    .classed("floormap", true)
    .call(configZoom(zoomed))
    .on("click", setZoom)

const panningLayer = svgContainer
    .append("g")
    .classed("panning-layer", true)

const groups = panningLayer
    .selectAll("g")
    .data(arrOfKeys)
    .enter()
    .append("g")
    .attr("class", (d)=>d)

const assets = groups
    .selectAll("path")
    .data(d=> geoData[d]?.features)
    .enter()
    .append("path")
    .attr("d", d3Path)
    .classed("selectable", true)
    .on("click", setZoom)

// Dom event handler
document.addEventListener("click", (e)=>{
    resetZoom(e);
})
