class ScatterPlot {

    constructor(parentElement, controlsParentElt, data, title="Line Chart",
                axes=[new Axis('X-Axis'), new Axis('Y-Axis')],
                filters={},
                processData=function(d) {return d},
                preselectedPlayers = [],
                dim = [400, 400]
                ){
        this.parentElement = parentElement;
        this.controlsParentElt = controlsParentElt
        this.processData = processData
        this.data = this.processData(data);
        this.displayData = this.data
        this.axes = axes;
        this.filters = filters;
        this.title = title;
        this.dim = dim

        this.styles = {
            opacity: 0.2
        }

        this.clickedPlayers = preselectedPlayers
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 25, right: 100, bottom: 50, left: 100};

        console.log(document.getElementById(vis.parentElement).getBoundingClientRect())

        vis.width = vis.dim[0]//document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right
        vis.height = vis.dim[1]//document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom
        console.log(vis.width, vis.height)

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Overlay with path clipping
        vis.svg.append("defs").append("clipPath")
            .attr("id", "clip"+vis.title)
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        // Scales and axes
        vis.yearColor = d3.scaleOrdinal()
            .range(['#648FFF','#DC267F','#FE6100','#FFB000'])
            .domain(['2018', '2019', '2020', '2021'])

        // Symbol scale
        vis.symbolScale = d3.scaleOrdinal()
            .range([d3.symbolSquare, d3.symbolTriangle, d3.symbolStar])

        vis.x = d3.scaleLinear()
            .range([0, vis.width])
            .domain(d3.extent(vis.data, d=>vis.axes[0].access(d)))

        vis.y = d3.scaleLinear()
            .range([vis.height, 0])
            .domain(d3.extent(vis.data, d=>vis.axes[1].access(d)))

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d=>vis.axes[0].display(d))
            .ticks(5)

        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(d=>vis.axes[1].display(d))
            .ticks(5)

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.svg.append("text")
            .attr("transform", `translate(${(vis.width/2)},${(vis.height+vis.margin.top+15)})`)
            .attr("class", "xlabel")
            .attr("text-anchor", "middle")
            .text(vis.axes[0].title)

        vis.svg.append("text")
            .attr("transform", `translate(-${vis.margin.left/2}, ${vis.height/2}) rotate(-90)`)
            .attr("class", "ylabel")
            .attr("text-anchor", "middle")
            .text(vis.axes[1].title)

        vis.svg.append("text")
            .attr("transform", `translate(${vis.width/2},5)`)
            .attr("text-anchor", "middle")
            .text(vis.title)

        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', vis.title + 'ToolTip')

        // Init controls
        let axisControls = d3.select('#'+vis.controlsParentElt).selectAll(`.axis-select`)

        axisControls.selectAll('option')
            .data(Object.values(axes_dict))
            .enter().append('option')
            .text(d => d.title)
            .attr('value', d => d.abbr)
            .property('selected', function(d){return d3.select(this.parentNode).classed('x-axis-select') ? d.abbr === vis.axes[0].abbr : d.abbr === vis.axes[1].abbr})

        axisControls.on("change", function(e) {
            let selectValue = d3.select(this).property('value')
            let xBool = d3.select(this).classed('x-axis-select')
            vis.axes[xBool?0:1] = axes_dict[selectValue]
            vis.wrangleData()
        })

        // Make color key
        vis.yearColor.domain().forEach((d, i) => {
            if (Object.keys(vis.filters).includes('seasons') ? (!vis.filters.seasons.length || vis.filters.seasons.includes(d)) : true) {
            vis.svg.append("rect")
                .attr("x", vis.width + 10)
                .attr("y", 20 + 15 * i)
                .attr("width", 12).attr("height", 12)
                .attr("fill", vis.yearColor(d))
                .attr("stroke", "none")
            vis.svg.append("text")
                .attr("x", vis.width + 25)
                .attr("y", 32 + 15 * i)
                .text(d)
            }
        })

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this

        vis.displayData = vis.data
        let filterKeys = Object.keys(vis.filters)

        if (filterKeys.includes("players")) {
            Object.filter(vis.displayData, elt => vis.filters.players.includes(elt.player_id))
        }

        if (filterKeys.includes("seasons")) {
            Object.filter(vis.displayData, elt => vis.filters.seasons.includes(elt.season))
        }

        vis.updateVis()
    }

    updateVis() {
        let vis = this;
        console.log("updating scatter plot "+vis.title)

        // update axes
        vis.x.domain(d3.extent(vis.data, d=>vis.axes[0].access(d)))
        vis.y.domain(d3.extent(vis.data, d=>vis.axes[1].access(d)))
        d3.select('#'+vis.parentElement).select('.xlabel').text(vis.axes[0].title)
        d3.select('#'+vis.parentElement).select('.ylabel').text(vis.axes[1].title)


        //Draw the points
        let circles = vis.svg.selectAll("circle")
            .data(vis.displayData, d => `${d.player_id}${d.season}`)

        circles.enter()
            .append('circle')
            //.style("fill", d => vis.colors(d.player_id))
            .attr("class", d => "c"+d.player_id)
            .attr("cx", p => vis.x(vis.axes[0].access(p)))
            .attr("cy", p => vis.y(vis.axes[1].access(p)))
            .attr("r", 6)
            .attr("opacity", vis.styles.opacity)
            .attr("stroke", "none")
            .on("click", function(event,d){vis.playerClicked(event, d)})
            .on("mouseover", function(event, d) {
                vis.mouseover(d)
                vis.showTooltip(event,`
                         <div>
                            <h5>${d.player_name}: ${d.season}</h5>
                            <h6><span class="float-left">${vis.axes[0].title}: </span> <span class="float-right">${vis.axes[0].display(vis.axes[0].access(d))}</span></h6>
                            <h6><span class="float-left">${vis.axes[1].title}: </span> <span class="float-right">${vis.axes[1].display(vis.axes[1].access(d))}</span></h6>
                         </div>`)
            })
            .on("mouseout", function(event, d) {
                vis.mouseout(d)
            })
            .merge(circles).transition(2000)
            .attr("cx", p => vis.x(vis.axes[0].access(p)))
            .attr("cy", p => vis.y(vis.axes[1].access(p)))
        circles.exit().transition(1000)
            .attr("opacity", 0)
            .remove()

        // Make clicked players key
        if (vis.clickedPlayers.length) {
            vis.symbolScale.domain(vis.clickedPlayers)
            vis.clickedPlayers.forEach((d,i) => {
                // Act as if they're clicked
                console.log(d)
                vis.svg.selectAll("circle.c"+d)
                    .attr("r", 8)
                    .attr("fill", p => vis.yearColor(p.season))
                    .attr("opacity", 1)
                    .raise()
                //vis.svg.append('path')
            })
        } else {
            // vis.svg.append("text")
            //     .attr('x',vis.width+25)
            //     .attr('y', 110)
            //     .text("Click on a player to highlight their data")
        }

        // Call axis functions with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);
    }

    playerClicked(_event, d) {
        let vis = this
        let ind = vis.clickedPlayers.indexOf(d.player_id)
        if (ind == -1) {
            vis.clickedPlayers.push(d.player_id)
            if (vis.clickedPlayers.length >= 4) {
                vis.clickedPlayers.splice(1, 1)
            }
        } else {
            vis.clickedPlayers.splice(ind, 1)
            vis.svg.selectAll("circle.c"+d.player_id)
                .attr("r", 6)
                .attr("fill", "black")
                .attr("opacity", vis.styles.opacity)
        }
        //console.log("clicked "+d.player_name)
    }
    mouseover(d) {
        let vis = this
        //console.log("over", d)

        vis.svg.selectAll("circle.c"+d.player_id)
            //.selectAll("circle")
            //.transition(20)
            .attr("r", 8)
            .attr("fill", d => vis.yearColor(d.season))
            .attr("opacity", 1)

        vis.svg.selectAll(".c"+d.player_id).raise()
    }
    mouseout(d) {
        let vis = this
        //console.log("out", d)

        vis.tooltip
            .style("opacity", 0)
            .style("left", 0)
            .style("top", 0)
            .html(``);
        if (!vis.clickedPlayers.includes(d.player_id)) {
            vis.svg.selectAll("circle.c" + d.player_id)
                .transition(2000)
                .attr("r", 6)
                .attr("fill", "black")
                .attr("opacity", vis.styles.opacity)
        }
    }
    showTooltip(event, content) {
        let vis = this
        vis.tooltip
            .style("opacity", .75)
            .style("left", event.pageX + 5 + "px")
            .style("top", event.pageY + 15 + "px")
            .html(content);
    }
}
