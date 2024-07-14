import "./lib/d3.v7.js";
import "./lib/topojson-client.js";

const canvas = {
    w: 1000,
    h: 1000
};

const topoData = await d3.json(`./one_bedroom.json`);

const geoData = {};

const arrOfKeys = Object.keys(topoData.objects);

arrOfKeys.forEach(key => {
    geoData[key] = topojson.feature(topoData, key);
})

const d3Identity = d3.geoIdentity();

const d3Projection = d3Identity
    .fitSize([canvas.w, canvas.h], geoData["apartment"]);

const d3Path = d3.geoPath(d3Projection);

const svgContainer = d3
    .select("#svg_container")
    .append("svg")
    .attr("viewBox", `0 0 ${canvas.w} ${canvas.h}`)
    .classed("floormap", true)

const groups = svgContainer
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