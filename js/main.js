let linechart;
let exploreScatter;

let players = {
    "Grandal, Yasmani":'518735',
    "Brantley, Michael":'488726',
    "Escobar, Alcides":'444876',
    "Fletcher, David": '664058',
    "Martinez, J.D.": '502110',
    "Harper, Bryce": '547180',
}

// Tab triggers
let triggerTabList = [].slice.call(document.querySelectorAll('#navTabs button'))
triggerTabList.forEach(function (triggerEl) {
    let tabTrigger = new bootstrap.Tab(triggerEl)
    triggerEl.addEventListener('click', function (event) {
        event.preventDefault()
        tabTrigger.show()
    })
})

// Load in the visualizations
loadData()

function loadData() {

    // line chart data
    d3.csv('data/BOS_aggregate_2s_min50.csv', row => {
        let d = {};
        d['player_id'] = row['player_id']
        d['player_name'] = row['player_name']
        d['season'] = row['year']
        d['avg'] = row['ba']
        return d;
    }).then(data => {
        linechart = new LineChart('linechart', data, 'Two-Strike Avg by Season',
            [new Axis('Season'), new Axis('Two-Strike Average')],
            [], function (dataIn) {
                // arrange the data into an object layered by player
                let players = [];
                dataIn.forEach(e => {
                    //console.log(e)
                    if(players.indexOf(e.player_id) === -1) {
                        //console.log(e.player_name, e.player_id)
                        players.push([e.player_id, e.player_name])
                    }
                })
                //players = players.slice(0,5)
                return players.map(p => {
                    let pId = p[0]
                    let pName = p[1]
                    return {
                        player_name: pName,
                        player_id: pId,
                        points: dataIn.filter(e => e.player_name == pName)
                            .map(e => {return {season: +e.season, avg: +e.avg}})
                            .sort((a,b) => b.season - a.season)
                    }
                })
            }
        )
        linechart.initVis()
    })

    // scatter plot data
    d3.csv('data/combinedData.csv', row => {
        Object.keys(axes_dict).forEach(key => {
            row[key] = +row[key]
        })
        return row;
    }).then(data => {
        exploreScatter = new ScatterPlot("exploreScatterPlot", "explorePlotControls",data, "Explore Statistics",
            [axes_dict["kpct"], axes_dict["s2avg"]])
        exploreScatter.initVis()

        let hl1ScatterPlot = new ScatterPlot("hl1ScatterPlot", "none",data, "Strikeouts are 2-Strike Outs",
            [axes_dict["kpct"], axes_dict["s2avg"]], {},
            function (d) {return d}, [players["Brantley, Michael"]],
            [300, 300]
            )
        hl1ScatterPlot.initVis()

        let hl2ScatterPlot = new ScatterPlot("hl2ScatterPlot", "none",data, "Good Hitters Stay Good Hitters with 2 Strikes",
            [axes_dict["avg"], axes_dict["s2avg"]], {},
            function (d) {return d}, [players["Fletcher, David"], players['Escobar, Alcides'], players['Martinez, J.D.']],
            [350, 350]
        )
        hl2ScatterPlot.initVis()

        let hl3ScatterPlot = new ScatterPlot("hl3ScatterPlot", "none",data, "Swing and a... walk?",
            [axes_dict["swpct"], axes_dict["bbpct"]], {},
            function (d) {return d}, [players["Harper, Bryce"]],
            [350, 350]
        )
        hl3ScatterPlot.initVis()
    })
}