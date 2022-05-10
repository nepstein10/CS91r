class LineChart {
    constructor(parentElement, data, title="Line Chart",
                axes=[new Axis('Season'), new Axis('Two-Strike Average')],
                filters=[],
                processData=function(d) {return d}){
        this.parentElement = parentElement;
        this.processData = processData
        this.data = this.processData(data);
        this.axes = axes;
        this.filters = filters;
        this.title = title;
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 25, right: 100, bottom: 50, left: 100};

        vis.width = 400//document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 400//document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Overlay with path clipping
        vis.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        // Scales and axes
        vis.colors = d3.scaleOrdinal()
            .domain(vis.data.map(value => value.player_id))
            .range(["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"])

        vis.x = d3.scaleLinear()
            .range([0, vis.width])
            .domain([2018,2021])//d3.extent(vis.data, d=> d.season));

        vis.y = d3.scaleLinear()
            .range([vis.height, 0])
            .domain([0, .4])//d3.max(vis.data, d=>d.avg) + .2]) // change to max avg in data plus 10%

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d=>d)
            .ticks(4)

        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(d=>d.toFixed(3));

        vis.svg.append("text")
            .attr("transform", `translate(${(vis.width/2)},${(vis.height+vis.margin.top+15)})`)
            .attr("id", "xlabel")
            .attr("text-anchor", "middle")
            .text(vis.axes[0].title)

        vis.svg.append("text")
            .attr("transform", `translate(-${vis.margin.left/2}, ${vis.height/2}) rotate(-90)`)
            .attr("id", "ylabel")
            .attr("text-anchor", "middle")
            .text(vis.axes[1].title)

        vis.svg.append("text")
            .attr("transform", `translate(${vis.width/2},5)`)
            .attr("text-anchor", "middle")
            .text(vis.title)

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'lineChartToolTip')

        vis.updateVis();
    }

    updateVis() {
        let vis = this;
        console.log("updating line chart", vis.data)

        //Draw the lines
        let line = d3.line()
            .x(d => vis.x(+d.season))
            .y(d => vis.y(+d.avg))
        let lines = vis.svg.selectAll("path")
            .data(vis.data, d => d.points.season)
        lines.join(
            enter => {enter.append("path")
                .attr("fill", "none")
                .attr("stroke-width", 3)
                .attr("stroke", d => vis.colors(d.player_id))
                .attr("d", d => line(d.points))
                .attr("class", d => "c"+d.player_id)
                .on("mouseover", function(event, d) {
                    vis.mouseover(d)
                    vis.showTooltip(event,`
                         <div>
                            <h5>${d.player_name}</h5>
                         </div>`);
                })
                .on("mouseout", function(event, d) {
                    vis.mouseout(d)
                })
                .selection()}
            , update => {update
                .transition().duration(1000)
                .attr("d", d => line(d.points))
                .selection()}
            , exit => {exit
                .transition().duration(1000)
                .attr("stroke-width", 0)
                .remove()}
        )

        //Draw the dots
        let dots = vis.svg.selectAll(".dots")
            .data(vis.data)
            .enter()
            .append('g')
            .style("fill", d => vis.colors(d.player_id))
            .attr("class", d => "dots c"+d.player_id)
            //.attr("class", d => d.player_id)
            .selectAll("circle")
            .data(d => d.points)
            .enter()
            .append("circle")
            .attr("cx", p => vis.x(p.season))
            .attr("cy", p => vis.y(p.avg))
            .attr("r", 6)
            .attr("stroke", "none")
            .on("mouseover", function(event, d) {
                let p = d3.select(this.parentNode).datum()
                vis.mouseover(p)
                vis.showTooltip(event,`
                         <div>
                            <h5>${p.player_name}</h5>
                            <h6>${d.season}: ${d.avg}</h6>
                         </div>`)
            })
            .on("mouseout", function(event) {
                vis.mouseout(d3.select(this.parentNode).datum())
            })


        // Call axis functions with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);
    }

    mouseover(d) {
        let vis = this
        console.log("over", d)

        vis.svg.selectAll("path.c"+d.player_id)
            //.selectAll("path")
            .attr("stroke-width", 5)
            .attr("stroke", "black")

        vis.svg.selectAll(".c"+d.player_id+" circle")
            //.selectAll("circle")
            .attr("r", 8)
            .attr("fill", "black")

        vis.svg.selectAll(".c"+d.player_id).raise()
    }
    mouseout(d) {
        let vis = this
        console.log("out", d)

        vis.tooltip
            .style("opacity", 0)
            .style("left", 0)
            .style("top", 0)
            .html(``);

        vis.svg.selectAll("path.c"+d.player_id)
            //.selectAll("path")
            .attr("stroke-width", 3)
            .attr("stroke", vis.colors(d.player_id))

        vis.svg.selectAll(".c"+d.player_id+" circle")
            //.selectAll("circle")
            .attr("r", 6)
            .attr("fill", vis.colors(d.player_id))
    }
    showTooltip(event, content) {
        let vis = this
        vis.tooltip
            .style("opacity", 1)
            .style("left", event.pageX + 5 + "px")
            .style("top", event.pageY + 15 + "px")
            .html(content);
    }
}
